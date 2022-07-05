import crypto from 'crypto'
import type { HashringOptions, Node } from './type'

export default class Hashring {
  /**
   * 每个真实服务器节点映射的虚拟节点数量
   */
  private vnodes = 100

  private algorithm = 'md5'

  /**
   * hash环中虚拟服务器节点与真实服务器节点之间的映射
   */
  private ring: Record<string, Node> = {}

  private keys: string[] = []

  private nodes: Node[] = []

  private nodeMap: Record<string, number> = {}

  /**
   *
   * @param nodes 服务器节点可以以两种方式中的一种传递（['127.0.0.1:2333', {address: '127.0.0.1:8888', vnodes: 20}]）
   * @param options
   */
  constructor(nodes: Array<string | Node>, options?: HashringOptions) {
    if (options?.vnodes)
      this.vnodes = options.vnodes

    if (options?.algorithm)
      this.algorithm = options.algorithm

    nodes.forEach((node) => {
      this.addNode(node)
    })
  }

  /**
   * 根据key值获取服务器节点（key => 虚拟服务器节点 => 真实服务器节点）
   *
   * @param {string} key
   */
  getNode(key: string) {
    if (this.getRingVNodeCount() === 0)
      return 0
    const hash = this.createHash(key)
    const pos = this.getNodePosition(hash)

    return this.ring[this.keys[pos]].address
  }

  /**
   * 获取所有真实服务器节点
   * @returns {string[]}
   */
  getNodes() {
    return this.nodes.map((node) => {
      return node.address
    })
  }

  /**
   * 向hash环添加服务器节点
   * @param {string | Node} node 真实服务器节点
   */
  addNode(node: string | Node): Hashring {
    const nodeObj = this.nodeParse(node)
    if (this.nodeMap[nodeObj.address])
      throw new Error(`Node "${nodeObj.address}" already exists in ring.`)
    this.nodeMap[nodeObj.address] = 1
    this.nodes.push(nodeObj)

    const vnodesCount = nodeObj.vnodes ?? this.vnodes

    for (let i = 0; i < vnodesCount; i++) {
      const nodeHash = this.createHash(`${nodeObj.address}:${i}`)

      this.keys.push(nodeHash)
      this.ring[nodeHash] = nodeObj
    }

    this.keys.sort()

    return this
  }

  /**
   * 从hash环中删除真实服务器节点对应的虚拟服务器节点
   * @param {string} node 真实服务器节点
   */
  removeNode(node: string): Hashring {
    if (this.nodeMap[node] === undefined)
      throw new Error(`Node "${node}" not found in ring.`)
    delete this.nodeMap[node]
    let index = -1
    let nodeToRemove: Node | undefined
    this.nodes.some((item, i) => {
      if (item.address === node) {
        index = i
        nodeToRemove = item
        return true
      }
      else {
        return false
      }
    })
    if (index > -1) {
      this.nodes.splice(index, 1)

      const vnodesCount = nodeToRemove!.vnodes ?? this.vnodes

      for (let i = 0; i < vnodesCount; i++) {
        const nodeHash = this.createHash(`${nodeToRemove!.address}:${i}`)
        delete this.ring[nodeHash]

        const indexKey = this.keys.indexOf(nodeHash)
        if (indexKey > -1)
          this.keys.splice(indexKey, 1)
      }
    }

    return this
  }

  /**
   * 获取hash环虚拟服务器节点数量
   * @returns {number} hash环中虚拟服务器节点数量
   */
  getRingVNodeCount() {
    return Object.keys(this.ring).length
  }

  /**
   * 生成字符串的哈希
   *
   * @param {string} key
   * @returns {string} Hash.
   * @api private
   */
  private createHash(key: string): string {
    return crypto.createHash(this.algorithm).update(key).digest('hex')
  }

  /**
   * 根据hash哈希获取Node服务器节点
   * 通过二分查找获取最优节点，第一个"服务器hash"值大于"数据hash"值的就是最优"服务器节点"
   * 如果查找出没有"服务器hash"值大于"数据hash"值，则取第一个服务器节点（hash环的特性）
   *
   * @param {string} hash 要查找的字段hash
   * @returns {number} Node position
   * @api private
   */
  private getNodePosition(hash: string) {
    const len = this.getRingVNodeCount() - 1
    let startIndex = 0
    let endIndex = len

    while (startIndex <= endIndex) {
      const middleIndex = startIndex + Math.floor((endIndex - startIndex) / 2)

      // If we've found the element just return its position.
      if (this.keys[middleIndex] === hash)
        return middleIndex

      // Decide which half to choose for seeking next: left or right one.
      if (this.keys[middleIndex] < hash) {
      // Go to the right half of the array.
        startIndex = middleIndex + 1
      }
      else {
      // Go to the left half of the array.
        endIndex = middleIndex - 1
      }
    }

    if (startIndex > len) {
      // 如果查找出没有"服务器hash"值大于"数据hash"值，则取第一个服务器节点（hash环的特性）
      return 0
    }

    // 结束条件是 startIndex > endIndex，所以最优"服务器节点"就是 startIndex
    return startIndex
  }

  private nodeParse(node: string | Node): Node {
    return typeof node === 'string'
      ? {
          address: node,
        }
      : node
  }
}
