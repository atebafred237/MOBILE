import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';

const fallbackAvatar = name =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1e293b&color=fff&size=150`;

const ProfileAvatar = ({
  uri,
  name,
  style,
  resizeMode = 'cover',
  ...props
}) => {
  const [failedUri, setFailedUri] = useState(null);

  const sourceUri =
    failedUri === uri ? fallbackAvatar(name) : uri;

  useEffect(() => {
    setFailedUri(null);
  }, [uri]);

  return (
    <Image
      {...props}
      source={{ uri: sourceUri, cache: 'reload' }}
      style={style}
      resizeMode={resizeMode}
      onError={(error) => {
        console.log('🔥 PROFILE IMAGE ERROR:', error.nativeEvent);
        console.log('🔥 PROFILE IMAGE URI:', uri);
        setFailedUri(uri);
      }}
    />
  );
};

export default ProfileAvatar;