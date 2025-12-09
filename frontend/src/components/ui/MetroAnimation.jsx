import React from 'react';

const MetroAnimation = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/Video_Direction_Correction_and_Delivery.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Optional: Add an overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
};

export default MetroAnimation;
