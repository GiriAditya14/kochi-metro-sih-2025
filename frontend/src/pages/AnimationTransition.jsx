import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AnimationTransition() {
  const navigate = useNavigate()
  const videoRef = useRef(null)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    // Listen to video end event to redirect automatically
    const video = videoRef.current
    if (video) {
      const handleVideoEnd = () => {
        navigate('/dashboard')
      }
      
      video.addEventListener('ended', handleVideoEnd)
      
      // Fallback timeout in case video doesn't trigger ended event
      const fallbackTimer = setTimeout(() => {
        navigate('/dashboard')
      }, 3500) // 3.5 seconds fallback (3 seconds video + 0.5 buffer)

      return () => {
        video.removeEventListener('ended', handleVideoEnd)
        clearTimeout(fallbackTimer)
      }
    }
  }, [navigate])

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Reverses the video horizontally
        onLoadedMetadata={(e) => {
          // Limit video playback to 3 seconds
          e.target.addEventListener('timeupdate', function() {
            if (this.currentTime >= 3) {
              this.pause()
              navigate('/dashboard')
            }
          })
        }}
      >
        <source src="/From%20KlickPin%20CF%20Northern%20duo%20%5BVideo%5D%20_%20Motion%20design%20animation%20Motion%20design%20video%20Motion%20graphics%20inspiration-vmake.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Loading indicator overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-3">
            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full loading-bar" />
            </div>
            <p className="text-white text-sm font-medium animate-pulse">Initializing your workspace...</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loadingProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .loading-bar {
          animation: loadingProgress 3s linear forwards;
        }
      `}</style>
    </div>
  )
}
