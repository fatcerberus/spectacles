/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { DataStream, Prim } from 'sphere-runtime';

export default
class SpriteImage
{
	constructor(fileName)
	{
	    const fs = new DataStream(fileName, FileOp.Read);
	    const rss = fs.readStruct({
	        signature:   { type: 'fstring', length: 4 },
	        version:     { type: 'uint16le' },
	        numImages:   { type: 'uint16le' },
	        frameWidth:  { type: 'uint16le' },
	        frameHeight: { type: 'uint16le' },
	        numPoses:    { type: 'uint16le' },
	        baseX1:      { type: 'uint16le' },
	        baseY1:      { type: 'uint16le' },
	        baseX2:      { type: 'uint16le' },
	        baseY2:      { type: 'uint16le' },
	        reserved:    { type: 'raw', size: 106 },
	    });
	    if (rss.signature !== '.rss' || rss.version !== 3)
	        throw new Error(`Couldn't load Sphere spriteset '${fileName}'`);
	    const images = [];
	    for (let i = 0; i < rss.numImages; ++i) {
	        const pixels = fs.read(4 * rss.frameWidth * rss.frameHeight);
	        images.push(new Texture(rss.frameWidth, rss.frameHeight, pixels));
	    }
	    const poses = {};
	    for (let i = 0; i < rss.numPoses; ++i) {
	        const poseInfo = fs.readStruct({
	            numFrames: { type: 'uint16le' },
	            reserved:  { type: 'raw', size: 6 },
	            name:      { type: 'lstr16le' },
	        });
	        const pose = { frames: [] };
	        for (let j = 0; j < poseInfo.numFrames; ++j) {
	            const frameInfo = fs.readStruct({
	                imageIndex: { type: 'uint16le' },
	                delay:      { type: 'uint16le' },
	                reserved:   { type: 'raw', size: 4 },
	            });
	            const frame = { image: images[frameInfo.imageIndex], delay: frameInfo.delay };
	            pose.frames.push(frame);
	        }
	        poses[poseInfo.name] = pose;
	    }
	    fs.dispose();

	    this.currentPose = Object.keys(poses)[0];
	    this.elapsedFrames = 0;
	    this.frame = 0;
	    this.poses = poses;
	}

	get pose()
	{
		return this.currentPose;
	}

	set pose(value)
	{
		if (!(value in this.poses))
			throw new ReferenceError(`Spriteset pose '${value}' doesn't exist`);
		this.currentPose = value;
	}

	blit(x, y, alpha = 1.0)
	{
		const pose = this.poses[this.currentPose]
		const image = pose.frames[this.frame % pose.frames.length].image;
		Prim.blit(Surface.Screen, x, y, image, Color.White.fadeTo(alpha));
	}

	reset()
	{
		this.frame = 0;
		this.elapsedFrames = 0;
	}

	resume()
	{
		this.stopped = false;
	}

	stop()
	{
		this.stopped = true;
	}

	update()
	{
		if (this.stopped)
			return;
		let frames = this.poses[this.currentPose].frames;
		if (this.elapsedFrames >= frames[this.frame].delay) {
			this.frame = (this.frame + 1) % frames.length;
			this.elapsedFrames = 0;
		}
		else {
			++this.elapsedFrames;
		}
	}
}
