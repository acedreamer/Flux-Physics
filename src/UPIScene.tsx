import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const UPIScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance animation
  const phoneSlide = interpolate(frame, [0, 40], [-300, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const phoneScale = spring({
    frame,
    fps,
    from: 0.5,
    to: 1,
    durationInFrames: 50,
    config: {
      damping: 200,
    },
  });

  // Title animations
  const titleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleSlide = interpolate(frame, [30, 60], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // UPI logo pulse animation
  const upiPulse = spring({
    frame: frame - 40,
    fps,
    from: 1,
    to: 1.1,
    durationInFrames: 30,
    config: {
      damping: 100,
    },
  });

  // Transaction growth chart animations
  const chart2016Width = interpolate(frame, [80, 120], [0, 15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const chart2024Width = interpolate(frame, [100, 150], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Transaction amount counter
  const transactionAmount = Math.floor(
    interpolate(frame, [120, 160], [1, 18], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // User count animation
  const userCount = Math.floor(
    interpolate(frame, [140, 180], [0, 300], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Feature cards animation
  const card1Slide = interpolate(frame, [160, 190], [-200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const card2Slide = interpolate(frame, [170, 200], [200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const card3Slide = interpolate(frame, [180, 210], [-200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Final message animation
  const finalOpacity = interpolate(frame, [220, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const finalScale = spring({
    frame: frame - 220,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 40,
    config: {
      damping: 150,
    },
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative',
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      {/* Main Content Container */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        
        {/* Phone Icon with UPI Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            transform: `translateX(${phoneSlide}px) scale(${phoneScale})`,
          }}
        >
          <div
            style={{
              width: '120px',
              height: '200px',
              background: 'linear-gradient(145deg, #2c3e50, #34495e)',
              borderRadius: '25px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
            }}
          >
            {/* Phone Screen */}
            <div
              style={{
                width: '100px',
                height: '160px',
                background: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                transform: `scale(${upiPulse})`,
              }}
            >
              📱
            </div>
            
            {/* UPI Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              UPI
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            marginBottom: '40px',
          }}
        >
          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #667eea, #764ba2, #FF6B35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '15px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            Unified Payments Interface
          </h1>
          
          <p
            style={{
              fontSize: '1.8rem',
              color: '#ffffff',
              marginBottom: '10px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            🟦 A revolution in digital payments
          </p>
          
          <div
            style={{
              display: 'inline-block',
              background: 'linear-gradient(45deg, #4CAF50, #45a049)',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
            }}
          >
            🇮🇳 Made in India, Used Worldwide
          </div>
        </div>

        {/* Transaction Growth Chart */}
        {frame >= 80 && (
          <div
            style={{
              width: '700px',
              marginBottom: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '30px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <h3
              style={{
                textAlign: 'center',
                marginBottom: '25px',
                fontSize: '1.8rem',
                color: '#FFD700',
              }}
            >
              📈 UPI Transaction Growth
            </h3>
            
            {/* 2016 Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '1.1rem', minWidth: '60px' }}>2016</span>
                <div
                  style={{
                    flex: 1,
                    height: '40px',
                    background: 'linear-gradient(90deg, #ff6b6b, #ee5a24)',
                    borderRadius: '20px',
                    width: `${chart2016Width}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '15px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(255, 107, 107, 0.3)',
                    transition: 'width 0.5s ease',
                  }}
                >
                  ₹1L Cr
                </div>
              </div>
            </div>

            {/* 2024 Bar */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '1.1rem', minWidth: '60px' }}>2024</span>
                <div
                  style={{
                    flex: 1,
                    height: '40px',
                    background: 'linear-gradient(90deg, #4CAF50, #45a049)',
                    borderRadius: '20px',
                    width: `${chart2024Width}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '15px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
                    transition: 'width 0.5s ease',
                  }}
                >
                  ₹{transactionAmount}L Cr/month
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        {frame >= 140 && (
          <div
            style={{
              display: 'flex',
              gap: '30px',
              marginBottom: '40px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(145deg, #667eea, #764ba2)',
                padding: '25px',
                borderRadius: '20px',
                textAlign: 'center',
                minWidth: '200px',
                boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👥</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700' }}>
                {userCount}M+
              </div>
              <div style={{ fontSize: '1rem' }}>Active Users</div>
            </div>

            <div
              style={{
                background: 'linear-gradient(145deg, #4CAF50, #45a049)',
                padding: '25px',
                borderRadius: '20px',
                textAlign: 'center',
                minWidth: '200px',
                boxShadow: '0 10px 20px rgba(76, 175, 80, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏦</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700' }}>
                400+
              </div>
              <div style={{ fontSize: '1rem' }}>Partner Banks</div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        {frame >= 160 && (
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '40px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(145deg, #FF6B35, #F7931E)',
                padding: '20px',
                borderRadius: '15px',
                textAlign: 'center',
                minWidth: '180px',
                transform: `translateX(${card1Slide}px)`,
                boxShadow: '0 8px 16px rgba(255, 107, 53, 0.3)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Instant</div>
              <div style={{ fontSize: '0.9rem' }}>24/7 Transfers</div>
            </div>

            <div
              style={{
                background: 'linear-gradient(145deg, #e74c3c, #c0392b)',
                padding: '20px',
                borderRadius: '15px',
                textAlign: 'center',
                minWidth: '180px',
                transform: `translateX(${card2Slide}px)`,
                boxShadow: '0 8px 16px rgba(231, 76, 60, 0.3)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Secure</div>
              <div style={{ fontSize: '0.9rem' }}>Bank-Grade Security</div>
            </div>

            <div
              style={{
                background: 'linear-gradient(145deg, #9b59b6, #8e44ad)',
                padding: '20px',
                borderRadius: '15px',
                textAlign: 'center',
                minWidth: '180px',
                transform: `translateX(${card3Slide}px)`,
                boxShadow: '0 8px 16px rgba(155, 89, 182, 0.3)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Free</div>
              <div style={{ fontSize: '0.9rem' }}>No Transaction Fees</div>
            </div>
          </div>
        )}

        {/* Final Message */}
        {frame >= 220 && (
          <div
            style={{
              opacity: finalOpacity,
              transform: `scale(${finalScale})`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B35)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '15px',
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              📲 UPI – Fast, Free, Secure
            </div>
            
            <div
              style={{
                fontSize: '1.5rem',
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              🇮🇳 India's Digital Payment Revolution
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};