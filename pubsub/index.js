'use strict'

const IpfsHttpClient = require('ipfs-http-client')
const { sleep, Logger, onEnterPress, catchAndLog } = require('./util')

async function main () {
  const apiUrlInput = document.getElementById('api-url')
  const nodeConnectBtn = document.getElementById('node-connect')

  const peerAddrInput = document.getElementById('peer-addr')
  const peerConnectBtn = document.getElementById('peer-connect')

  const topicInput = document.getElementById('topic')
  const subscribeBtn = document.getElementById('subscribe')

  const messageInput = document.getElementById('message')
  const sendBtn = document.getElementById('send')

  const distanceInput = document.getElementById('approach-meters')

  let log = Logger(document.getElementById('console'));
  let ipfs;
  let topic;
  let peerId;
  let dentroDaDistancia = false;
  let myData = {data: [{message:'', id:''}]}
  let otherData = {data: [{message:'', id:''}]}
  let offlineData = {data: [{message:'', id:''}]}

  async function reset () {
    if (ipfs && topic) {
      log(`Unsubscribing from topic ${topic}`)
      await ipfs.pubsub.unsubscribe(topic)
    }
    log = Logger(document.getElementById('console'))
    topicInput.value = ''
    topic = null
    peerId = null
    ipfs = null
  }

  async function nodeConnect (url) {
    await reset()
    log(`Connecting to ${url}`)
    ipfs = IpfsHttpClient(url)
    const { id, agentVersion } = await ipfs.id()
    peerId = id
    log(`<span class="green">Success!</span>`)
    log(`Version ${agentVersion}`)
    log(`Peer ID ${id}`)
  }

  async function peerConnect (addr) {
    if (!addr) throw new Error('Missing peer multiaddr')
    if (!ipfs) throw new Error('Connect to a node first')
    log(`Connecting to peer ${addr}`)
    await ipfs.swarm.connect(addr)
    log(`<span class="green">Success!</span>`)
    log('Listing swarm peers...')
    await sleep()
    const peers = await ipfs.swarm.peers()
    peers.forEach(peer => {
      const fullAddr = `${peer.addr}/ipfs/${peer.peer.toString()}`
      log(`<span class="${addr.endsWith(peer.peer.toString()) ? 'teal' : ''}">${fullAddr}</span>`)
    })
    log(`(${peers.length} peers total)`)
  }

  async function subscribe (nextTopic='acidente') {
    if (!nextTopic) throw new Error('Missing topic name')
    if (!ipfs) throw new Error("You'll receive news when within reach of another device")
    /*
    const lastTopic = topic
    
    if (topic) {
      topic = null
      log(`Unsubscribing from topic ${lastTopic}`)
      await ipfs.pubsub.unsubscribe(lastTopic)
    }
    */
    log(`Subscribing to ${nextTopic}...`)

    await ipfs.pubsub.subscribe('acidente', msg => {
      const from = msg.from
      const seqno = msg.seqno.toString('hex')
      if (from === peerId) return log(`Ignoring message ${seqno} from self`)
      log(`Message ${seqno} from ${from}:`)
      try {
        otherData = JSON.parse(msg.data.toString())
        console.log('otherData: ');
        console.log(otherData);
        console.log('myData:');
        console.log(myData);
        for (let i=0; i<otherData.data.length; i++) {
          myData.data.push(otherData.data[i]);
        }
        console.log('myData concatenada:');
        console.log(myData)

        let filteredData = []
        for (let i=0; i<myData.data.length; i++) {
          let existe = false;
          for (let j=0; j<filteredData.length; j++) {
            if (filteredData[j].id == myData.data[i].id) {
              existe = true
            }
          }
          if (!existe) {
            filteredData.push(myData.data[i]);
          }
        }
        myData.data = filteredData;
        
        log("News sent:")
        log(JSON.stringify(myData.data[myData.data.length-1].message.toString(), null, 2))
        log("Synced news list:")
        filteredData.map(each => log(JSON.stringify(each.message.toString(), null, 2)))
      } catch (_) {
        log("<span class='red'>Something went wrong</span>")
      }
    })

    topic = 'acidente'
    log(`<span class="green">Success!</span>`)
  }

  async function send (msg) {
    if (!msg) throw new Error('Missing message')
    if (!topic) {
      topic = 'acidente';
      await onSubscribeClick();
    }
    if (!ipfs) {
      myData.data.push({
        id: Math.random()*10000,
        message: messageInput.value
      })
      log("Saving news to be sent when another device connects")
    }
    else {
      log(`Sending message to ${topic}...`)
      await ipfs.pubsub.publish(topic, msg)
      log(`<span class="green">Success!</span>`)
    }
  }

  async function distance () {
    if (distanceInput.value < 10 && !dentroDaDistancia) {
      await onNodeConnectClick()
      await onSubscribeClick()
      myData.data.map(item => log(item.message))
      dentroDaDistancia = true
    }
    else if(distanceInput.value > 10 && dentroDaDistancia) {
      dentroDaDistancia=false
      log(`<span class="red">Connection lost</span>`)
    }
  }

  
/*
-----iot-iot
merge in-server:
    each one send in-server to the other one
    merge arrays
    delete identical entries
filter data on both iots:
    if data id in in-server, delete
merge data:
    each one send data to the other one
    merge arrays
    delete identical entries

-----iot-server
merge in-server:
    each one send in-server to the other one
    merge arrays
    delete identical entries
filter data on iot:
    if data id in in-server, delete
send data to server:
    send data to server
delete all data from iot
*/

  distanceInput.addEventListener('change', distance)

  const onNodeConnectClick = catchAndLog(() => nodeConnect(apiUrlInput.value), log)

  apiUrlInput.addEventListener('keydown', onEnterPress(onNodeConnectClick))
  nodeConnectBtn.addEventListener('click', onNodeConnectClick)

  const onPeerConnectClick = catchAndLog(() => peerConnect(peerAddrInput.value), log)
  peerAddrInput.addEventListener('keydown', onEnterPress(onPeerConnectClick))
  peerConnectBtn.addEventListener('click', onPeerConnectClick)

  const onSubscribeClick = catchAndLog(() => subscribe('acidente'), log)
  topicInput.addEventListener('keydown', onEnterPress(onSubscribeClick))
  subscribeBtn.addEventListener('click', onSubscribeClick)

  await onSubscribeClick()

  const onSendClick = catchAndLog(async () => {
    myData.data.push({
      id: Math.random()*10000,
      message: messageInput.value
    })
    messageInput.value = ''
    await send(JSON.stringify(myData))
  }, log)
  messageInput.addEventListener('keydown', onEnterPress(onSendClick))
  sendBtn.addEventListener('click', onSendClick)
}

main()
