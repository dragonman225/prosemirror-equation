export function getDefaultContent() {
  const contentElement = document.querySelector('#content')
  if (!contentElement) {
    throw new Error('Failed to find #content')
  }
  return contentElement
}
