'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import SignaturePad from 'signature_pad'

export interface SignatureCanvasHandle {
  isEmpty: () => boolean
  toDataURL: () => string
  clear: () => void
}

interface Props {
  disabled?: boolean
  penColor?: string
}

const SignatureCanvas = forwardRef<SignatureCanvasHandle, Props>(
  function SignatureCanvas({ disabled, penColor = '#ffffff' }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const padRef    = useRef<SignaturePad | null>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const pad = new SignaturePad(canvas, {
        penColor,
        backgroundColor: 'rgba(0,0,0,0)',
        minWidth:      1.5,
        maxWidth:      3,
      })
      padRef.current = pad

      function resize() {
        if (!canvas) return
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const data  = pad.toData()
        canvas.width  = canvas.offsetWidth  * ratio
        canvas.height = canvas.offsetHeight * ratio
        canvas.getContext('2d')?.scale(ratio, ratio)
        pad.clear()
        pad.fromData(data)
      }

      resize()
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
    }, [])

    useEffect(() => {
      if (!padRef.current) return
      if (disabled) {
        padRef.current.off()
      } else {
        padRef.current.on()
      }
    }, [disabled])

    useImperativeHandle(ref, () => ({
      isEmpty:   () => padRef.current?.isEmpty() ?? true,
      toDataURL: () => padRef.current?.toDataURL('image/png') ?? '',
      clear:     () => padRef.current?.clear(),
    }))

    return (
      <div className="relative rounded-xl overflow-hidden border border-white/20 bg-white/[0.04]"
           style={{ height: 140 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{ cursor: disabled ? 'not-allowed' : 'crosshair' }}
        />
        {/* Línea guía */}
        <div className="pointer-events-none absolute bottom-8 left-6 right-6 h-px bg-white/15" />
        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/20 select-none">
          Firma aquí
        </p>
      </div>
    )
  },
)

export default SignatureCanvas
