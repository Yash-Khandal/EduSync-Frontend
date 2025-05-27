import React from 'react';

const Loader = () => {
  return (
    <>
      <div className="loader mx-auto my-5"></div>
      <style>{`
        .loader {
          width: 45px;
          aspect-ratio: 1;
          --c: no-repeat linear-gradient(#000 0 0);
          background: var(--c), var(--c), var(--c), var(--c), var(--c), var(--c);
          animation: 
            l14-1 0.5s infinite alternate,
            l14-2 2s infinite;
        }
        @keyframes l14-1 {
          0%,10% {background-size: 20% 100%;}
          100%   {background-size: 20% 20%;}
        }
        @keyframes l14-2 {
          0%,49.9% {background-position: 0 0, 0 100%, 50% 50%, 50% 50%, 100% 0, 100% 100%;}
          50%,100% {background-position: 0 50%, 0 50%, 50% 0, 50% 100%, 100% 50%, 100% 50%;}
        }
      `}</style>
    </>
  );
};

export default Loader;
