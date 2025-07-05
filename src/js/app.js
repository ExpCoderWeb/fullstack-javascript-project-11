import i18n from 'i18next'
import onChange from 'on-change'
import resources from './locales/index.js'
import { initialRender, render } from './view.js'
import {
  createSchema,
  setYupLocale,
  runUpdatingPosts,
  addFeed,
} from './utils.js'

export default () => {
  const elements = {
    form: document.querySelector('[data-rss-form]'),
    formFeedback: document.querySelector('[data-form-feedback]'),
    urlInput: document.querySelector('[data-url-input]'),
    addUrlButton: document.querySelector('[data-add-url-button]'),
    feedsContainer: document.querySelector('[data-feeds]'),
    postsContainer: document.querySelector('[data-posts]'),
    modalPostTitle: document.querySelector('[data-modal-post-title]'),
    modalPostDescription: document.querySelector('[data-modal-post-description]'),
    modalReadMoreButton: document.querySelector('[data-read-more-button]'),
    modalCloseButton: document.querySelector('[data-dismiss-modal-text]'),
    initialTextElements: {
      pageTitle: document.querySelector('[data-title]'),
      modalReadMoreButton: document.querySelector('[data-read-more-button]'),
      modalCloseButton: document.querySelector('[data-dismiss-modal-text]'),
      heading: document.querySelector('[data-heading]'),
      slogan: document.querySelector('[data-slogan]'),
      urlInput: document.querySelector('[data-url-input]'),
      urlLabel: document.querySelector('[data-url-label]'),
      addUrlButton: document.querySelector('[data-add-url-button]'),
      urlExample: document.querySelector('[data-url-example]'),
      createdBy: document.querySelector('[data-created-by]'),
      authorInfo: document.querySelector('[data-author-info]'),
    },
  }

  const defaultLanguage = 'ru'

  const i18nInstance = i18n.createInstance()
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  })

  initialRender(elements.initialTextElements, i18nInstance)
  setYupLocale()

  const initialState = {
    rssLinks: [],
    feeds: [],
    posts: {
      allPosts: [],
      newPosts: [],
    },
    form: {
      processState: 'filling',
      errorKey: '',
    },
    uiState: {
      modal: {
        openedPostId: null,
      },
      viewedPostsIds: [],
    },
  }

  const watchedState = onChange(initialState, (path, value) => {
    render(elements, i18nInstance, watchedState, path, value)
  })
  runUpdatingPosts(watchedState)

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault()
    watchedState.form.processState = 'adding'

    const formData = new FormData(e.target)
    const rssLink = formData.get('url').trim()

    const schema = createSchema(watchedState.rssLinks)
    return schema.validate(rssLink)
      .then(() => addFeed(rssLink, watchedState))
      .catch((error) => {
        if (error.name === 'AxiosError') {
          watchedState.form.errorKey = 'formFeedback.errors.network'
        }
        else if (error.name === 'ValidationError') {
          const { key: errorKey } = error.message
          watchedState.form.errorKey = errorKey
        }
        else {
          const { message: errorKey } = error
          watchedState.form.errorKey = errorKey
        }
        watchedState.form.processState = 'error'
      })
  })
}
