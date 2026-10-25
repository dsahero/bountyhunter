/** Whether a media path is a video clip (played muted and looping) rather than an image. */
export const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src);
