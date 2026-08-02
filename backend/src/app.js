import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import authRoutes from './routes/auth.routes.js'
import ttsRoutes from './routes/tts.routes.js'
import practiceRoutes from './routes/practice.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/tts', ttsRoutes)
app.use('/api/v1/practice', practiceRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Route not found' })
})

app.use(errorHandler)
