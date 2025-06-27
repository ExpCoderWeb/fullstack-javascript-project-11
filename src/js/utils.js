import axios from 'axios'
import uniqueId from 'lodash/uniqueId.js'
import { string, setLocale } from 'yup'

const createSchema = (rssLinks) => {
  return string().required().url().notOneOf(rssLinks)
}

const setYupLocale = () => {
  setLocale({
    mixed: {
      required: () => ({ key: 'formFeedback.errors.validation.required' }),
      notOneOf: () => ({ key: 'formFeedback.errors.validation.alreadyExists' }),
    },
    string: {
      url: () => ({ key: 'formFeedback.errors.validation.invalidUrl' }),
    },
  })
}

const getProxiedUrl = (url) => {
  const proxiedUrl = new URL('/get', 'https://allorigins.hexlet.app')
  proxiedUrl.searchParams.set('url', url)
  proxiedUrl.searchParams.set('disableCache', 'true')
  return proxiedUrl.toString()
}

const parseRss = (rss) => {
  const parser = new DOMParser()
  const xmlDocument = parser.parseFromString(rss, 'text/xml')
  const errorNode = xmlDocument.querySelector('parsererror')
  if (errorNode) {
    throw new Error('formFeedback.errors.validation.noRss')
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

const getNewPosts = (posts, feedId, state) => {
  const currentFeedIdPosts = state.posts.allPosts.filter(post => post.feedId === feedId)
  return posts.filter(newPost => !currentFeedIdPosts.some(oldPost => newPost.postLink === oldPost.postLink))
}

const getRssData = (rssLink, state) => {
  const proxiedUrl = getProxiedUrl(rssLink)
  return axios.get(proxiedUrl, { timeout: 5000 })
    .then((response) => {
      const { contents } = response.data
      const { channel: feed, items } = parseRss(contents)

      const currentFeed = state.feeds.find(({ feedLink }) => feedLink === rssLink)
      const feedId = currentFeed ? currentFeed.feedId : uniqueId()

      const newFeed = {
        feedId,
        feedTitle: feed.title,
        feedDescription: feed.description,
        feedLink: rssLink,
      }

      const posts = items.map((item) => {
        return {
          feedId,
          postTitle: item.title,
          postDescription: item.description,
          postLink: item.link,
        }
      })

      const newPosts = getNewPosts(posts, feedId, state)
      newPosts.forEach((post) => {
        post.postId = uniqueId()
      })

      return { newFeed, newPosts }
    })
}

const updatePosts = (rssLink, state) => {
  return getRssData(rssLink, state)
    .then(({ newPosts }) => {
      if (newPosts.length === 0) {
        return
      }
      state.posts.allPosts = state.posts.allPosts.concat(newPosts)
      state.posts.newPosts = newPosts
    })
    .catch(() => {})
}

const addFeed = (rssLink, state) => {
  return getRssData(rssLink, state)
    .then(({ newFeed, newPosts }) => {
      state.rssLinks.push(rssLink)
      state.feeds.push(newFeed)
      state.posts.allPosts = state.posts.allPosts.concat(newPosts)
      state.posts.newPosts = newPosts
      state.form.errorKey = null
      state.form.processState = 'added'
    })
}

const runUpdatingPosts = (state) => {
  const promises = state.rssLinks.map(rssLink => updatePosts(rssLink, state))
  return Promise.allSettled(promises)
    .then(() => setTimeout(() => runUpdatingPosts(state), 5000))
}

export {
  createSchema,
  setYupLocale,
  addFeed,
  runUpdatingPosts,
}
