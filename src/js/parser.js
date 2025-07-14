export default (rss) => {
  const parser = new DOMParser()
  const xmlDocument = parser.parseFromString(rss, 'text/xml')
  const errorNode = xmlDocument.querySelector('parsererror')
  if (errorNode) {
    const error = new Error('formFeedback.errors.validation.noRss')
    error.isParsingError = true
    error.errorNode = errorNode
    error.source = rss
    throw error
  }

  const titleEl = xmlDocument.querySelector('title')
  const descriptionEl = xmlDocument.querySelector('description')

  const items = [...xmlDocument.querySelectorAll('item')].map((item) => {
    const itemTitleEl = item.querySelector('title')
    const itemDescriptionEl = item.querySelector('description')
    const itemLinkEl = item.querySelector('link')
    return {
      title: itemTitleEl.textContent,
      description: itemDescriptionEl.textContent,
      link: itemLinkEl.textContent,
    }
  })

  return {
    channel: {
      title: titleEl.textContent,
      description: descriptionEl.textContent,
    },
    items,
  }
}
