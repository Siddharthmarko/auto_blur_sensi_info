import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './composition/MainComposition';
import { Project } from '../types/project';

const defaultProject: Project = {
  video: {
    src: '',
    name: 'Untitled',
    width: 1920,
    height: 1080,
    durationInFrames: 300,
    fps: 30,
    durationInSeconds: 10,
  },
  effects: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition as any}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          project: defaultProject,
        }}
        calculateMetadata={async ({ defaultProps, props }: any) => {
          const currentProject = props?.project || defaultProps?.project;
          const video = currentProject?.video;
          return {
            durationInFrames: video?.durationInFrames && video.durationInFrames > 0 ? video.durationInFrames : 300,
            fps: video?.fps && video.fps > 0 ? video.fps : 30,
            width: video?.width && video.width > 0 ? video.width : 1920,
            height: video?.height && video.height > 0 ? video.height : 1080,
            props: {
              project: currentProject,
            },
          };
        }}
      />
    </>
  );
};
