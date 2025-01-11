import { FC } from "react";

import './shooter.css';

interface Props {
  rotation?: number;
  stage?: number;
}

const Shooter: FC<Props> = (props) => {
  return (<>
    <div className="shooter" />
    <div className="canon stage-0" style={{rotate: (props.rotation ?? 0) + 'deg'}}/>
  </>)
}
export default Shooter;