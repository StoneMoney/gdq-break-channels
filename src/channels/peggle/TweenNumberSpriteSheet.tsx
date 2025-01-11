import { FC, ReactNode } from 'react';

import { useIncrementNumber } from '../../lib/hooks/useIncrementNumber';
import './main.css';

interface Props {
	prefix?: ReactNode;
	value?: number;
	fps?: number;
}

const TweenNumberSpriteSheet: FC<Props> = (props) => {
	const number = useIncrementNumber(props.value ?? 0, props.fps);
	return (
		<>
			{props.prefix}
			{number.toLocaleString('en-US', { maximumFractionDigits: 0 }).split("").map((char, i)=>
				<div key={i} className={`font-sprite char-${char.replace(',','comma')}`}></div>
			)}
		</>
	);
};

export default TweenNumberSpriteSheet;
