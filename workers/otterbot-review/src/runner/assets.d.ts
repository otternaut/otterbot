/** Trusted Markdown assets are embedded as text by the runner build. */
declare module "*.md?raw" {
  const content: string;
  export default content;
}
