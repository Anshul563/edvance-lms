import Svg, { Path, type SvgProps } from "react-native-svg";

type EdvanceLogoProps = Omit<SvgProps, "viewBox"> & {
  size?: number;
};

export function EdvanceLogo({ size = 32, ...props }: EdvanceLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" {...props}>
      <Path d="M100 63.58L1.5 0V102.74H198.5V0L100 63.58Z" fill="#CC8BDF" />
      <Path d="M100 200L198.5 102.74L100 63.58L1.5 102.74L100 200Z" fill="#621A76" />
      <Path d="M78.3896 178.66L99.9996 200L121.61 178.66L99.9996 157.18L78.3896 178.66Z" fill="#310D3B" />
      <Path d="M1.5 102.74L100 63.58L198.5 102.74L100 157.18L1.5 102.74Z" fill="#A32CC4" />
    </Svg>
  );
}
