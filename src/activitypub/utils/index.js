import crypto from 'crypto'
import as from 'activitystrea.ms'
import { activityPub } from '../ActivityPub'
import gql from 'graphql-tag'
import { createSignature } from '../security'
import request from 'request'
const debug = require('debug')('ea:utils')

export function extractNameFromId (uri) {
  const urlObject = new URL(uri)
  const pathname = urlObject.pathname
  const splitted = pathname.split('/')

  return splitted[splitted.indexOf('users') + 1]
}

export function extractIdFromActivityId (uri) {
  const urlObject = new URL(uri)
  const pathname = urlObject.pathname
  const splitted = pathname.split('/')

  return splitted[splitted.indexOf('status') + 1]
}

export function constructIdFromName (name, fromDomain = activityPub.domain) {
  return `https://${fromDomain}/activitypub/users/${name}`
}

export function extractDomainFromUrl (url) {
  return new URL(url).hostname
}

export async function getActorIdByName (name) {
  debug(`name = ${name}`)
  return Promise.resolve()
}

export function sendCollection (collectionName, req, res) {
  const name = req.params.name
  const id = constructIdFromName(name)

  switch (collectionName) {
  case 'followers':
    attachThenCatch(activityPub.getFollowersCollection(id), res)
    break

  case 'followersPage':
    attachThenCatch(activityPub.getFollowersCollectionPage(id), res)
    break

  case 'following':
    attachThenCatch(activityPub.getFollowingCollection(id), res)
    break

  case 'followingPage':
    attachThenCatch(activityPub.getFollowingCollectionPage(id), res)
    break

  case 'outbox':
    attachThenCatch(activityPub.getOutboxCollection(id), res)
    break

  case 'outboxPage':
    attachThenCatch(activityPub.getOutboxCollectionPage(id), res)
    break

  default:
    res.status(500).end()
  }
}

function attachThenCatch (promise, res) {
  return promise
    .then((collection) => {
      res.status(200).contentType('application/activity+json').send(collection)
    })
    .catch((err) => {
      debug(`error getting a Collection: = ${err}`)
      res.status(500).end()
    })
}

export function createActor (name, pubkey) {
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    'id': `https://${activityPub.domain}/activitypub/users/${name}`,
    'type': 'Person',
    'preferredUsername': `${name}`,
    'name': `${name}`,
    'following': `https://${activityPub.domain}/activitypub/users/${name}/following`,
    'followers': `https://${activityPub.domain}/activitypub/users/${name}/followers`,
    'inbox': `https://${activityPub.domain}/activitypub/users/${name}/inbox`,
    'outbox': `https://${activityPub.domain}/activitypub/users/${name}/outbox`,
    'url': `https://${activityPub.domain}/activitypub/@${name}`,
    'endpoints': {
      'sharedInbox': `https://${activityPub.domain}/activitypub/inbox`
    },
    'publicKey': {
      'id': `https://${activityPub.domain}/activitypub/users/${name}#main-key`,
      'owner': `https://${activityPub.domain}/activitypub/users/${name}`,
      'publicKeyPem': pubkey
    }
  }
}

export function createWebFinger (name) {
  return {
    'subject': `acct:${name}@${activityPub.domain}`,
    'links': [
      {
        'rel': 'self',
        'type': 'application/activity+json',
        'href': `https://${activityPub.domain}/users/${name}`
      }
    ]
  }
}

export function createOrderedCollection (name, collectionName) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `https://${activityPub.domain}/activitypub/users/${name}/${collectionName}`,
    'summary': `${name}s ${collectionName} collection`,
    'type': 'OrderedCollection',
    'first': `https://${activityPub.domain}/activitypub/users/${name}/${collectionName}?page=true`,
    'totalItems': 0
  }
}

export function createOrderedCollectionPage (name, collectionName) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `https://${activityPub.domain}/activitypub/users/${name}/${collectionName}?page=true`,
    'summary': `${name}s ${collectionName} collection`,
    'type': 'OrderedCollectionPage',
    'totalItems': 0,
    'partOf': `https://${activityPub.domain}/activitypub/users/${name}/${collectionName}`,
    'orderedItems': []
  }
}

export function createNoteActivity (text, name, id, published) {
  const createUuid = crypto.randomBytes(16).toString('hex')

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `https://${activityPub.domain}/activitypub/users/${name}/status/${createUuid}`,
    'type': 'Create',
    'actor': `https://${activityPub.domain}/activitypub/users/${name}`,
    'object': {
      'id': `https://${activityPub.domain}/activitypub/users/${name}/status/${id}`,
      'type': 'Note',
      'published': published,
      'attributedTo': `https://${activityPub.domain}/activitypub/users/${name}`,
      'content': text,
      'to': 'https://www.w3.org/ns/activitystreams#Public'
    }
  }
}

export function createArticleActivity (text, name, id, published) {
  const createUuid = crypto.randomBytes(16).toString('hex')

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `https://${activityPub.domain}/activitypub/users/${name}/status/${createUuid}`,
    'type': 'Create',
    'actor': `https://${activityPub.domain}/activitypub/users/${name}`,
    'object': {
      'id': `https://${activityPub.domain}/activitypub/users/${name}/status/${id}`,
      'type': 'Article',
      'published': published,
      'attributedTo': `https://${activityPub.domain}/activitypub/users/${name}`,
      'content': text,
      'to': 'https://www.w3.org/ns/activitystreams#Public'
    }
  }
}

export function sendAcceptActivity (theBody, name, targetDomain, url) {
  as.accept()
    .id(`https://${activityPub.domain}/activitypub/users/${name}/status/` + crypto.randomBytes(16).toString('hex'))
    .actor(`https://${activityPub.domain}/activitypub/users/${name}`)
    .object(theBody)
    .prettyWrite((err, doc) => {
      if (!err) {
        return signAndSend(doc, name, targetDomain, url)
      } else {
        debug(`error serializing Accept object: ${err}`)
        throw new Error('error serializing Accept object')
      }
    })
}

export function sendRejectActivity (theBody, name, targetDomain, url) {
  as.reject()
    .id(`https://${activityPub.domain}/activitypub/users/${name}/status/` + crypto.randomBytes(16).toString('hex'))
    .actor(`https://${activityPub.domain}/activitypub/users/${name}`)
    .object(theBody)
    .prettyWrite((err, doc) => {
      if (!err) {
        return signAndSend(doc, name, targetDomain, url)
      } else {
        debug(`error serializing Accept object: ${err}`)
        throw new Error('error serializing Accept object')
      }
    })
}

export function throwErrorIfGraphQLErrorOccurred (result) {
  if (result.error && (result.error.message || result.error.errors)) {
    throw new Error(`${result.error.message ? result.error.message : result.error.errors[0].message}`)
  }
}

export function signAndSend (activity, fromName, targetDomain, url) {
  // fix for development: replace with http
  url = url.indexOf('localhost') > -1 ? url.replace('https', 'http') : url
  debug(`passhprase = ${process.env.PRIVATE_KEY_PASSPHRASE}`)
  return new Promise(async (resolve, reject) => {
    debug('inside signAndSend')
    // get the private key
    const result = await activityPub.dataSource.client.query({
      query: gql`
          query {
              User(slug: "${fromName}") {
                  privateKey
              }
          }
      `
    })

    if (result.error) {
      reject(result.error)
    } else {
      // add security context
      const parsedActivity = JSON.parse(activity)
      if (Array.isArray(parsedActivity['@context'])) {
        parsedActivity['@context'].push('https://w3id.org/security/v1')
      } else {
        const context = [parsedActivity['@context']]
        context.push('https://w3id.org/security/v1')
        parsedActivity['@context'] = context
      }

      // deduplicate context strings
      parsedActivity['@context'] = [...new Set(parsedActivity['@context'])]
      const privateKey = result.data.User[0].privateKey
      const date = new Date().toUTCString()

      debug(`url = ${url}`)
      request({
        url: url,
        headers: {
          'Host': targetDomain,
          'Date': date,
          'Signature': createSignature(privateKey, `http://${activityPub.domain}/activitypub/users/${fromName}#main-key`, url,
            {
              'Host': targetDomain,
              'Date': date,
              'Content-Type': 'application/activity+json'
            }),
          'Content-Type': 'application/activity+json'
        },
        method: 'POST',
        body: JSON.stringify(parsedActivity)
      }, (error, response) => {
        if (error) {
          debug(`Error = ${JSON.stringify(error, null, 2)}`)
          reject(error)
        } else {
          debug('Response Headers:', JSON.stringify(response.headers, null, 2))
          debug('Response Body:', JSON.stringify(response.body, null, 2))
          resolve()
        }
      })
    }
  })
}
