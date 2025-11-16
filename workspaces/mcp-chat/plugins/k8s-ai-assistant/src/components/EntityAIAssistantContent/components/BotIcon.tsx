import React from 'react';

interface BotIconProps {
  size?: number;
  color?: string;
}

export const BotIcon: React.FC<BotIconProps> = ({
  size = 30,
  color = '#333',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill={color}
    >
      <path d="M71,21.2V5H58v14H41V5H29v15C14.1,22,3,34,3,49v0.7C3,66.1,16.4,79,33.5,79H52V64H33.1C24.5,64,18,57.7,18,49.3v-0.7 C18,40.3,24.5,34,33.1,34l26.3,0c11.2,0,21.1,8.1,22.7,19.2C84.1,67,73.5,79,60.2,79H52v15h8.7c19.4,0,36-14.5,37.8-33.8 C100.1,41.8,87.9,25.9,71,21.2z" />
      <rect x="31" y="43" width="12" height="12" />
      <rect x="55" y="43" width="12" height="12" />
    </svg>
  );
};
