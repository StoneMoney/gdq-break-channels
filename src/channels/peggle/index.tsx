import { useEffect, useRef, useState } from 'react';
import type { FormattedDonation, Total } from '@gdq/types/tracker';
import { Level, Save } from './types';
import { ChannelProps, registerChannel } from '../channels';
import Matter, { Engine, Render, Bodies, Body, World, Events, Composite } from 'matter-js';

import { useListenFor, useReplicant } from 'use-nodecg';
import styled from '@emotion/styled';
import TweenNumber from '@gdq/lib/components/TweenNumber';

import bucketTop from './assets/sprites/bucket-top.png';
import bucketMiddle from './assets/sprites/bucket-middle.png';
import bucketBottom from './assets/sprites/bucket-bottom.png';

import ball from './assets/sprites/ball.png';
import frame from './assets/bgs/Frame.png'
import bg from './assets/bgs/bg1.jpg'
import './main.css';
import { calcBucketSpeed, calculateOffsets, loadLevel } from './util';
import TweenNumberSpriteSheet from './TweenNumberSpriteSheet';
import Shooter from './components/shooter';

registerChannel('Peggle', 30, Peggle, {
	position: 'topRight',
	site: 'GitHub',
	handle: 'StoneMoney',
});

export function Peggle(props: ChannelProps) {
	const [level, setLevel] = useState<Level>(loadLevel());
	const [pegs, setPegs] = useState<Bodies[]>([]);
	const [solids, setSolids] = useState<Bodies[]>([]);
	const [bucket, setBucket] = useState<Composite>();
	const [bucketDirection, setBucketDirection] = useState<boolean | null>(true);
	const [canonAngle, setCanonAngle] = useState<number>(0);

	const container = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
	const engine = useRef(Engine.create());
	const renderRef = useRef<Render | null>(null);
	const runner = useRef(Matter.Runner.create());

	const [world, setWorld] = useState<World>(engine.current.world);
	const [total] = useReplicant<Total | null>('total', null);

	const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
	const underlayCanvasRef = useRef<HTMLCanvasElement>(null);
	const ballImage = useRef<HTMLImageElement>(new Image());
	const bucketTopImage = useRef<HTMLImageElement>(new Image());
	const bucketMiddleImage = useRef<HTMLImageElement>(new Image());
	const bucketBottomImage = useRef<HTMLImageElement>(new Image());
	const frameImage = useRef<HTMLImageElement>(new Image());

	ballImage.current.src = ball;
	bucketTopImage.current.src = bucketTop;
	bucketMiddleImage.current.src = bucketMiddle;
	bucketBottomImage.current.src = bucketBottom;
	frameImage.current.src = frame;

	useEffect(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 1092;
		canvas.height = 332;
		canvas.id = 'matter-canvas';
		canvasRef.current = canvas;

		const render = Render.create({
			canvas,
			engine: engine.current,
			options: {
				width: 1092,
				height: 332,
				background: 'transparent',
				wireframes: false,
				pixelRatio: 1,
				hasBounds: false,
			},
		});
		renderRef.current = render;

		if (container.current) {
			container.current.appendChild(canvas);
		}

		Matter.Runner.run(runner.current, engine.current);
		Render.run(render);

		return () => {
			Render.stop(render);
			Matter.Runner.stop(runner.current);
			World.clear(engine.current.world, false);
			Engine.clear(engine.current);
			if (canvasRef.current) {
				canvasRef.current.remove();
			}
		};
	}, []);

	useEffect(() => {
		if (!world) return;
		console.log('World')
		const ground = Bodies.rectangle(546, 600, 2000, 150, { isStatic: true });
		const leftWall = Bodies.rectangle(55.5, 166, 111, 500, { isStatic: true, restitution: 2 });
		const rightWall = Bodies.rectangle(1036.5, 166, 111, 500, { isStatic: true, restitution: 1 });
		const topWall = Bodies.rectangle(546, -73, 938, 150, { isStatic: true, restitution: 1 });

		const bucketVerticesL = [
			{ x: 20, y: 0 },
			{ x: 20, y: 50 },
			{ x: 0, y: 50 },
			{ x: 0, y: 19 }
		].map(({ x, y }) => Matter.Vector.create(x, y));
		const bucketL = Bodies.fromVertices(105, 335, [bucketVerticesL], { isStatic: true, render: { fillStyle: "red" } });
		const bucketVerticesR = [
			{ x: 0, y: 0 },
			{ x: 0, y: 50 },
			{ x: 20, y: 50 },
			{ x: 20, y: 19 }
		].map(({ x, y }) => Matter.Vector.create(x, y));
		const bucketR = Bodies.fromVertices(245, 335, [bucketVerticesR], { isStatic: true, render: { fillStyle: "red" } });
		const bucketBase = Bodies.rectangle(175, 360, 95, 15, { isStatic: true, render: { fillStyle: "red" }, label: 'Bucket' });
		const bucketComposite = Composite.create();
		Composite.add(bucketComposite, [bucketL, bucketR, bucketBase]);
		setBucket(bucketComposite);

		World.add(world, [bucketComposite, ground, leftWall, rightWall, topWall]);

		Events.on(engine.current, 'collisionStart', (event) => {
			event.pairs.forEach((pair) => {
				const { bodyA, bodyB } = pair;

				const ball = [bodyA, bodyB].find((body) => body.label === 'Ball');
				if (ball && [bodyA, bodyB].includes(ground)) {
					World.remove(world, ball);
				} else if (ball && [bodyA, bodyB].includes(bucketBase)) {
					World.remove(world, ball);
					console.log("BONUS!")
				}

				const hitPeg = pegs.includes(bodyA) ? bodyA : pegs.includes(bodyB) ? bodyB : null;
				if (hitPeg && !hitPeg.plugin.hit) {
					hitPeg.render.fillStyle = 'orange';
					hitPeg.plugin.hit = true;
					setTimeout(() => {
						World.remove(world, hitPeg);
					}, 1600)
				}
			});
		});
	}, [world]);

	useEffect(() => {
		const aimHandler = (event: MouseEvent) => {
			if (!canvasRef.current) return;
			const rect = canvasRef.current.getBoundingClientRect();
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;

			const xLeg = 547 - mouseX
			const yLeg = 37 - mouseY

			const angle = Math.atan2(yLeg, xLeg) * (180 / Math.PI) + 90;
			const angleRange = Math.max(Math.min(angle, 80), -80)
			setCanonAngle(angleRange);
		}

		canvasRef.current.addEventListener('mousemove', aimHandler);

		return () => {
			if (canvasRef.current) {
				canvasRef.current.removeEventListener('mousemove', aimHandler);
			}
		};
	}, [world, canvasRef.current]);

	useEffect(()=>{
		const shootHandler = (event: MouseEvent) => {
			if (!world || !canvasRef.current) return;

			const velocity = 15;
			const { offsetX, offsetY } = calculateOffsets(canonAngle, 88);

			const newBall = Bodies.circle(offsetX + 547 - 12, offsetY + 37 - 12, 12, {
				restitution: 0.8,
				isStatic: false,
				render: {
					fillStyle: 'transparent',
				},
				label: 'Ball'
			});

			Body.setVelocity(newBall, {
				x: Math.cos(canonAngle) * velocity,
				y: Math.sin(canonAngle) * velocity,
			});

			World.add(world, newBall);
		};

		canvasRef.current.addEventListener('click', shootHandler);

		return () => {
			if (canvasRef.current) {
				canvasRef.current.removeEventListener('click', shootHandler);
			}
		};
	}, [world, canonAngle])
	useEffect(() => {
		const renderOverlay = () => {
			if (!overlayCanvasRef.current || !underlayCanvasRef.current) return;
			const overlayContext = overlayCanvasRef.current.getContext('2d');
			const underlayContext = underlayCanvasRef.current.getContext('2d');
			if (!overlayContext || !underlayContext) return;
			overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
			underlayContext.clearRect(0, 0, underlayCanvasRef.current.width, underlayCanvasRef.current.height);

			const bodies = Matter.Composite.allBodies(engine.current.world);
			if (ballImage.current) {
				const balls = bodies.filter((body) => body.label === 'Ball');
				for (let ball of balls) {
					overlayContext.drawImage(
						ballImage.current,
						ball.position.x - 12,
						ball.position.y - 12,
						24,
						24
					);
				};
				const { offsetX, offsetY } = calculateOffsets(canonAngle + 90, 88);
				overlayContext.drawImage(
					ballImage.current,
					offsetX + 547 - 12,
					offsetY + 37 - 12,
					24,
					24
				);
			}
			if (bucket && bucketTopImage && bucketMiddleImage && bucketBottomImage) {
				const bucketBody = bodies.find((body) => body.label === 'Bucket');
				if (bucketBody) {
					if (frameImage.current) {
						overlayContext.drawImage(
							frameImage.current,
							111,
							0
						)
					}
					overlayContext.drawImage(
						bucketTopImage.current,
						bucketBody.position.x - 50,
						bucketBody.position.y - 38,
					)
					overlayContext.drawImage(
						bucketMiddleImage.current,
						bucketBody.position.x - 85,
						bucketBody.position.y - 55
					)
					underlayContext.drawImage(
						bucketBottomImage.current,
						bucketBody.position.x - 85,
						bucketBody.position.y - 60
					)
				}
			}

			requestAnimationFrame(renderOverlay);
		};

		const animationFrameId = requestAnimationFrame(renderOverlay);

		return () => cancelAnimationFrame(animationFrameId);
	}, [bucket, canonAngle]);

	function moveBucket(bucketComposite: Composite, bucketDirection: boolean | null) {
		const xPos = bucketComposite.bodies[0].position.x

		const speed = calcBucketSpeed(xPos);

		const translation = (bucketDirection ?? false) ? { x: speed, y: 0 } : { x: -(speed), y: 0 };
		Composite.translate(bucketComposite, translation);
		if (bucketDirection && xPos > 800) {
			setBucketDirection(false)
		} else if (!bucketDirection && xPos < 150) {
			setBucketDirection(true)
		}
	}

	useEffect(() => {
		if (!bucket) return;
		const bucketInterval = setInterval(() => moveBucket(bucket, bucketDirection), 5);
		return () => {
			clearInterval(bucketInterval);
		}
	}, [bucket, bucketDirection]);

	useEffect(() => {
		if (!world || !canvasRef.current || !level || !renderRef.current) return;

		const pegsStaging: Body[] = [];
		const solidsStaging: Body[] = [];
		for (let peg of level.pegs) {
			const pegBody = Bodies.circle(peg.x, peg.y, 12, { isStatic: true, label: 'peg-' + peg.id });
			pegsStaging.push(pegBody);
			World.add(world, pegBody);
		}
		setPegs(pegsStaging);

		for (let solid of level.solids) {
			switch (solid.type) {
				case 'rectangle':
					const options = {
						isStatic: true,
						label: 'solid-' + solid.id,
						restitution: solid.restitution ?? 0,
						angle: solid.angle ?? 0,
						render: { fillStyle: solid.color ?? 'transparent' }
					};
					const solidBody = Bodies.rectangle(solid.x, solid.y, solid.width, solid.height, options);
					solidsStaging.push(solidBody);
					World.add(world, solidBody);
					break;
				case 'polygon':
					break;
				case 'circle':
					break;
			}
		}
		setSolids(solidsStaging);
	}, [level]);

	useListenFor('donation', (donation: FormattedDonation) => {
		// Handle donation
	});

	return (
		<Container>
			<TotalEl>
				$<TweenNumberSpriteSheet value={Math.floor(total?.raw ?? 0)} />
			</TotalEl>
			<div id="peggle-container" ref={container}>
				<canvas id="overlay-canvas" width={1092} height={332} ref={overlayCanvasRef} />
				<div className='shooter-parent'><Shooter rotation={canonAngle} stage={0} /></div>
				<canvas id="underlay-canvas" width={1092} height={332} ref={underlayCanvasRef} />
			</div>
			<img src={bg} className="backdrop" />
		</Container>
	);
}

const Container = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
`;

const TotalEl = styled.div`
    font-family: gdqpixel;
    font-size: 46px;
    color: white;

    position: absolute;
    left: 185px;
    top: 0px;
    z-index: 50;
`;