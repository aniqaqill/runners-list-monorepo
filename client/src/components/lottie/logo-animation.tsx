// logo from : https://iconscout.com/free-icon/running-2187448

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import animationDataWhite from '../../../data/lottie/running-white.json';
import animationDataBlack from '../../../data/lottie/running-black.json';

const LogoAnimation = () => {
  const { theme } = useTheme();
  const [Lottie, setLottie] = useState<null | typeof import('react-lottie').default>(null);

  useEffect(() => {
    import('react-lottie').then((Lottie) => {
      setLottie(() => Lottie.default);
    });
  }, []);

  if (!Lottie) {
    return null; // or a loading spinner
  }

  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: theme === 'dark' ? animationDataWhite : animationDataBlack,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return <Lottie options={defaultOptions} height={220} width={220} />;
};

export default LogoAnimation;