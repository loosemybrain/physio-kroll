/**
 * CSS Keyframes für alle Animation Types
 * Exportiert als String für Injection in <head> oder externe CSS
 */

export const ANIMATION_KEYFRAMES = `
/* Fade Animations */
@keyframes fadeAnimation {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeUpAnimation {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeDownAnimation {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeLeftAnimation {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeRightAnimation {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Scale Animations */
@keyframes scaleAnimation {
  from {
    transform: scale(0.8);
  }
  to {
    transform: scale(1);
  }
}

@keyframes scaleFadeAnimation {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide Animations */
@keyframes slideUpAnimation {
  from {
    transform: translateY(60px);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideDownAnimation {
  from {
    transform: translateY(-60px);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideLeftAnimation {
  from {
    transform: translateX(50vw);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideRightAnimation {
  from {
    transform: translateX(-60px);
  }
  to {
    transform: translateX(0);
  }
}

/* Blur Fade Animation */
@keyframes blurFadeAnimation {
  from {
    opacity: 0;
    filter: blur(10px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

/* Rotate Animation */
@keyframes rotateAnimation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Reduced Motion Fallback */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
