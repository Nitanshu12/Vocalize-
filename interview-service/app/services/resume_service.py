"""
Resume file -> plain text.

Deliberately dumb: this layer does no AI at all. It turns bytes into a string
and fails loudly with a message a *user* can act on. The LLM extraction happens
one layer up, in profile_service.

WHY NOT A PAID RESUME-PARSING API (Affinda, Sovren, HireAbility)?
They are genuinely more accurate at field-level extraction, but they cost money
per parse, and the hard part for us is not "find the job titles" — an LLM does
that well — it is turning a CV into good interview questions. So we spend the
budget on the model, not the parser.

WHY NOT REGEX RULES? Resumes have no format. Two columns, tables, icons,
reordered sections. Rules break on contact with reality; a language model does
not care about layout.
"""

from __future__ import annotations

import io

# Reject anything larger before we even read it — a resume is a page or two, so
# a huge file is either a mistake or an attack, and both deserve the same answer.
MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB

# Hard cap on the text we hand the model. Protects the free-tier token budget
# against a 60-page "portfolio" PDF. Two pages of dense text is ~6k characters,
# so this is generous.
MAX_TEXT_CHARS = 20_000

# Below this we almost certainly got a scanned/image-only PDF: pypdf returns a
# handful of stray characters and the model would hallucinate the rest.
MIN_TEXT_CHARS = 120

SUPPORTED_EXTENSIONS = (".pdf", ".docx", ".txt")


class ResumeParseError(ValueError):
    """User-fixable problem with the uploaded file (maps to HTTP 400)."""


def _extension(filename: str) -> str:
    name = (filename or "").lower()
    for ext in SUPPORTED_EXTENSIONS:
        if name.endswith(ext):
            return ext
    return ""


def _from_pdf(data: bytes) -> str:
    from pypdf import PdfReader  # imported lazily so the web server boots fast

    try:
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as exc:  # corrupt or encrypted PDF
        raise ResumeParseError(
            "We couldn't read that PDF. If it's password-protected, remove the "
            "password and try again."
        ) from exc


def _from_docx(data: bytes) -> str:
    from docx import Document  # python-docx

    try:
        document = Document(io.BytesIO(data))
        return "\n".join(p.text for p in document.paragraphs)
    except Exception as exc:
        raise ResumeParseError("We couldn't read that Word file. Try exporting it as a PDF.") from exc


def extract_text(data: bytes, filename: str) -> str:
    """Bytes + filename -> cleaned plain text, or ResumeParseError with a fix hint."""
    if not data:
        raise ResumeParseError("That file was empty.")
    if len(data) > MAX_FILE_BYTES:
        raise ResumeParseError("That file is larger than 5 MB — please upload a smaller resume.")

    ext = _extension(filename)
    if ext == ".pdf":
        text = _from_pdf(data)
    elif ext == ".docx":
        text = _from_docx(data)
    elif ext == ".txt":
        text = data.decode("utf-8", errors="ignore")
    else:
        raise ResumeParseError("Please upload a PDF, DOCX or TXT file.")

    # Collapse the ragged whitespace PDF extraction produces: it wastes tokens
    # and makes the text harder for the model to read.
    text = "\n".join(line.strip() for line in text.splitlines() if line.strip())

    if len(text) < MIN_TEXT_CHARS:
        raise ResumeParseError(
            "We couldn't find readable text in that file — it looks like a scan or "
            "an image. Please upload a text-based PDF, or fill in the quick questions instead."
        )
    return text[:MAX_TEXT_CHARS]
