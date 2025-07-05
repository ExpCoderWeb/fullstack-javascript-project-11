const createInnerContainer = (entityName, i18n) => {
  const innerContainer = document.createElement('div')
  innerContainer.classList.add('card', 'border-0')
  innerContainer.setAttribute(`data-inner-${entityName}-container`, '')

  const div = document.createElement('div')
  div.classList.add('card-body')
  const entityHeading = document.createElement('h2')
  entityHeading.classList.add('card-title', 'h4')
  entityHeading.textContent = i18n.t(`${entityName}Heading`)
  div.append(entityHeading)

  const entityList = document.createElement('ul')
  entityList.classList.add('list-group', 'border-0', 'rounded-0')
  entityList.setAttribute(`data-${entityName}-list`, '')

  innerContainer.append(div, entityList)
  return innerContainer
}

const insertChildren = (elements, entityName, children, i18n) => {
  const innerContainer = document.querySelector(`[data-inner-${entityName}-container]`)
  if (!innerContainer) {
    const newInnerContainer = createInnerContainer(entityName, i18n)
    const newFeedsList = newInnerContainer.querySelector(`[data-${entityName}-list]`)
    Array.isArray(children) ? newFeedsList.append(...children) : newFeedsList.append(children)
    elements[`${entityName}Container`].append(newInnerContainer)
  }
  else {
    const feedsList = innerContainer.querySelector(`[data-${entityName}-list]`)
    Array.isArray(children) ? feedsList.prepend(...children) : feedsList.prepend(children)
  }
}

const initialRender = (initialElements, i18n) => {
  Object.entries(initialElements).forEach(([elementName, element]) => {
    if (elementName === 'urlInput') {
      element.setAttribute('placeholder', i18n.t(elementName))
      return
    }
    const textNode = document.createTextNode(i18n.t(elementName))
    element.prepend(textNode)
  })
}

const handleProcessState = (elements, i18n, processState) => {
  switch (processState) {
    case 'added':
      elements.form.reset()
      elements.urlInput.focus()
      elements.urlInput.classList.remove('is-invalid')
      elements.formFeedback.classList.remove('text-danger')
      elements.formFeedback.classList.add('text-success')
      elements.formFeedback.textContent = i18n.t('formFeedback.success')
      elements.addUrlButton.disabled = false
      break
    case 'error':
      elements.addUrlButton.disabled = false
      break
    case 'adding':
      elements.addUrlButton.disabled = true
      break
    case 'filling':
      elements.addUrlButton.disabled = false
      break
    default:
      throw new Error(`Unknown process state: ${processState}`)
  }
}

const renderErrors = (elements, i18n, errorKey) => {
  if (!errorKey) {
    return
  }
  elements.urlInput.classList.add('is-invalid')
  elements.formFeedback.classList.remove('text-success')
  elements.formFeedback.classList.add('text-danger')
  elements.formFeedback.textContent = i18n.t(errorKey)
}

const renderFeeds = (elements, i18n, state) => {
  const { feedTitle, feedDescription } = state.feeds.at(-1)
  const li = document.createElement('li')
  li.classList.add('list-group-item', 'border-0', 'border-end-0')

  const h3 = document.createElement('h3')
  h3.classList.add('h6', 'm-0')
  h3.textContent = feedTitle

  const p = document.createElement('m-0', 'small', 'text-black-50')
  p.textContent = feedDescription

  li.append(h3, p)

  insertChildren(elements, 'feeds', li, i18n)
}

const renderPosts = (elements, i18n, state) => {
  const postsElements = state.posts.newPosts.map(({ postId, postLink, postTitle }) => {
    const li = document.createElement('li')
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0')

    const a = document.createElement('a')
    a.classList.add('fw-bold')
    a.setAttribute('href', postLink)
    a.setAttribute('data-id', postId)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
    a.textContent = postTitle

    a.addEventListener('click', (e) => {
      handleCheckPost(state, e)
    })

    const button = document.createElement('button')
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm')
    button.setAttribute('type', 'submit')
    button.setAttribute('data-id', postId)
    button.setAttribute('data-bs-toggle', 'modal')
    button.setAttribute('data-bs-target', '#modal')
    button.textContent = i18n.t('postPreviewButton')

    button.addEventListener('click', (e) => {
      handleCheckPost(state, e)
      state.uiState.modal.openedPostId = postId
    })

    li.append(a, button)
    return li
  })
  insertChildren(elements, 'posts', postsElements, i18n)
}

const handleCheckPost = (state, event) => {
  const { viewedPostsIds } = state.uiState
  const { id } = event.target.dataset
  if (viewedPostsIds.includes(id)) {
    return
  }
  viewedPostsIds.push(id)
}

const renderCheckedPost = (state) => {
  const checkedPostId = state.uiState.viewedPostsIds.at(-1)
  const checkedPost = document.querySelector(`[data-posts] a[data-id="${checkedPostId}"]`)
  checkedPost.classList.remove('fw-bold')
  checkedPost.classList.add('fw-normal', 'link-secondary')
}

const renderModalContent = (elements, state) => {
  const openedPost = state.posts.allPosts.find(({ postId }) => postId === state.uiState.modal.openedPostId)
  const { postTitle, postDescription, postLink } = openedPost
  elements.modalPostTitle.textContent = postTitle
  elements.modalPostDescription.textContent = postDescription
  elements.modalReadMoreButton.href = postLink
}

const render = (elements, i18n, state, onChangePath, onChangeValue) => {
  switch (onChangePath) {
    case 'form.processState':
      handleProcessState(elements, i18n, onChangeValue)
      break
    case 'form.errorKey':
      renderErrors(elements, i18n, onChangeValue)
      break
    case 'feeds':
      renderFeeds(elements, i18n, state)
      break
    case 'posts.newPosts':
      renderPosts(elements, i18n, state)
      break
    case 'uiState.viewedPostsIds':
      renderCheckedPost(state)
      break
    case 'uiState.modal.openedPostId':
      renderModalContent(elements, state)
      break
    default:
      break
  }
}

export { initialRender, render }
