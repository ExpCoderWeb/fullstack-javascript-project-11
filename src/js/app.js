import i18n from 'i18next'
import onChange from 'on-change'
import resources from './locales/index.js'
import { initialRender, render } from './watchers.js'
import {
  createSchema,
  setYupLocale,
  runUpdatingPosts,
  addFeed,
  handleCheckPost,
} from './utils.js'

export default () => {
  const elements = {
    form: document.querySelector('[data-rss-form]'),
    formFeedback: document.querySelector('[data-form-feedback]'),
    urlInput: document.querySelector('[data-url-input]'),
    addUrlButton: document.querySelector('[data-add-url-button]'),
    feedsContainer: document.querySelector('[data-feeds-container]'),
    postsContainer: document.querySelector('[data-posts-container]'),
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

  const i18nInstance = i18n.createInstance()
  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {
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
        status: 'filling',
        errorKey: null,
      },
      loadingProcess: {
        status: 'idle',
        errorKey: null,
      },
      uiState: {
        modalOpenedPostId: null,
        viewedPostsIds: [],
      },
    }

    const watchedState = onChange(initialState, render(elements, i18nInstance, initialState))
    runUpdatingPosts(watchedState)

    elements.form.addEventListener('submit', (event) => {
      event.preventDefault()
      watchedState.form.status = 'validating'

      const formData = new FormData(event.target)
      const rssLink = formData.get('url').trim()

      const schema = createSchema(watchedState.rssLinks)
      return schema.validate(rssLink)
        .then(() => {
          watchedState.loadingProcess.status = 'loading'
          return addFeed(rssLink, watchedState)
        })
        .catch((error) => {
          if (error.name === 'AxiosError') {
            Object.assign(watchedState.loadingProcess, { status: 'failed', errorKey: 'formFeedback.errors.network' })
          }
          else if (error.name === 'ValidationError') {
            const { key: errorKey } = error.message
            Object.assign(watchedState.form, { status: 'invalid', errorKey })
          }
          else {
            const { message: errorKey } = error
            Object.assign(watchedState.form, { status: 'invalid', errorKey })
          }
        })
    })

    elements.postsContainer.addEventListener('click', (event) => {
      const { tagName, dataset: { id } } = event.target
      if (tagName === 'A') {
        handleCheckPost(watchedState, id)
      }
      else if (tagName === 'BUTTON') {
        handleCheckPost(watchedState, id)
        watchedState.uiState.modalOpenedPostId = id
      }
    })
  })
}
