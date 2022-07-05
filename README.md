# vnode-hashring

A typescript implementation of consistent hash algorithm based on virtual nodes for Node.js

[![NPM version](https://img.shields.io/npm/v/vnode-hashring?color=a1b858&label=)](https://www.npmjs.com/package/vnode-hashring)

## Installation

``` bash
# npx pnpm install vnode-hashring
npm install vnode-hashring
```

## Usage

``` typescript
const Hashring = require('vnode-hashring')
const servers = [
  '127.0.0.1',
  '127.0.0.1:4000',
  '127.0.0.1:5000',
]
const cons = new Hashring(servers)
const codes = [
  '04615', '00133', '29599', '00195', '61532', '42529', '80009', '79087', '94467', '96384', '09874', '72902', '91466', '10546', '97845', '43680', '65013', '80230', '53824', '47539'
]
const nodes: Record<string, Array<string>> = {}

codes.forEach((code) => {
  const node = cons.getNode(code)
  if (node) {
    if (nodes[node.address]) { nodes[node.address].push(code) }
    else {
      nodes[node.address] = []
      nodes[node.address].push(code)
    }
  }
})
// nodes:
// {
//   "127.0.0.1": [
//     "00195", "61532", "96384", "91466", "43680", "65013", "47539"
//   ],
//   "127.0.0.1:4000": [
//     "04615", "29599", "94467", "09874", "72902", "97845", "53824",
//   ],
//   "127.0.0.1:5000": [
//     "00133", "42529", "80009", "79087", "10546", "80230",
//   ],
// }
const statistics: Record<string, number> = {}
Object.keys(nodes).forEach((node) => {
  statistics[node] = nodes[node].length
})
// statistics:
// {
//   "127.0.0.1": 7,
//   "127.0.0.1:4000": 7,
//   "127.0.0.1:5000": 6,
// }
```
### nodes

the first parameter is the server array which is being add to hash ring.

item can be strings(server address) or objects including address(server address) and vnodes(virtual node count)

**vnodes**: global vnodes count will be overwritten for this server node if you set the vnodes

``` typescript
new Hashring([
  '127.0.0.1', // 127.0.0.1: defatult 100
  {
    address: '127.0.0.1:4000',
    vnodes: 50
  }, // 127.0.0.1:4000: 50
])
```

### options
* `vnodes` The amount of virtual nodes per server, defaults to 100
* `algorithm` you can configure the algorithm that is used to hash the keys. It defaults to md5 and can only contain values that are accepted in Node's crypto API. 

``` typescript
new Hashring(['127.0.0.1'], {
  vnodes: 200,
  algorithm: 'sha256'
})
```

### API

#### getNode(**key**)

Find the correct node for which the key is closest to the point after what the given key hashes to.

* **key** {string}: Random key that needs to be searched in the hash ring

**return** {string}: The matching server address

``` typescript
cons.getNode('00195') // 127.0.0.1
cons.getNode('04615') // 127.0.0.1:4000
```

---

#### getNodes()

Get all the server address.

**return** {string[]}: server address array

``` typescript
cons.getNodes() // ['127.0.0.1', '127.0.0.1:4000', '127.0.0.1:5000']
```

---

#### addNode(**node**)

Add a new server to ring without having to re-initialize the hashring.

**return** {Hashring}: Hashring instance for call chaining

``` typescript
cons.addNode('127.0.0.1:6000')
// ['127.0.0.1', '127.0.0.1:4000', '127.0.0.1:5000', '127.0.0.1:6000']
// vnodes count: 100 + 100 + 100 + 100 = 400
cons.addNode({
  address: '127.0.0.1:7000',
  vnodes: 50
})
// ['127.0.0.1', '127.0.0.1:4000', '127.0.0.1:5000', '127.0.0.1:6000', '127.0.0.1:7000']
// vnodes count: 100 + 100 + 100 + 100 + 50 = 450
```

---

#### removeNode(**node**)

Remove a server from the hash ring.

* **node** {string}: Server address that need to be removed from the ring.

**return** {Hashring}: Hashring instance for call chaining

``` typescript
cons.removeNode('127.0.0.1:6000')
// ['127.0.0.1', '127.0.0.1:4000', '127.0.0.1:5000', '127.0.0.1:7000']
// vnodes count: 100 + 100 + 100 + 50 = 350
cons.addNode('127.0.0.1:7000')
// ['127.0.0.1', '127.0.0.1:4000', '127.0.0.1:5000']
// vnodes count: 100 + 100 + 100 = 300
```

---

#### getRingVNodeCount()

Get the virtual node count from the hash ring.

**return** {number}: the count of virtual nodes

``` typescript
cons.getRingVNodeCount('127.0.0.1:6000') // vnodes count: 100 + 100 + 100 = 300
```


## License

[MIT](./LICENSE) License © 2022 [su9er](https://github.com/su9er)
