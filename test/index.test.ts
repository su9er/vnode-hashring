import { describe, expect, test } from 'vitest'
import Hashring from '../src'

describe('hash ring', () => {
  const servers = [
    '127.0.0.1',
    '127.0.0.1:4000',
    '127.0.0.1:5000',
  ]
  const cons = new Hashring(servers)
  test('test nodes & vnodes count', () => {
    const nodes = cons.getNodes()
    const vnodesCount = cons.getRingVNodeCount()
    expect(nodes.length).toEqual(servers.length)
    expect(vnodesCount).toEqual(servers.length * 100)
  })

  test('test addNode & remove Node', () => {
    cons.addNode('127.0.0.1:6000')
    const nodes1 = cons.getNodes()
    expect(nodes1.length).toEqual(servers.length + 1)
    expect(nodes1).toMatchInlineSnapshot(`
      [
        "127.0.0.1",
        "127.0.0.1:4000",
        "127.0.0.1:5000",
        "127.0.0.1:6000",
      ]
    `)
    cons.removeNode('127.0.0.1:6000')
    const nodes2 = cons.getNodes()
    expect(nodes2.length).toEqual(servers.length)
    expect(nodes2).toMatchInlineSnapshot(`
      [
        "127.0.0.1",
        "127.0.0.1:4000",
        "127.0.0.1:5000",
      ]
    `)
  })

  test('test getNode(code1)', () => {
    const code1 = '61010'
    expect(cons.getNode(code1)).toMatchInlineSnapshot('"127.0.0.1:4000"')
  })

  test('test getNode(code2)', () => {
    const code2 = '40127'
    expect(cons.getNode(code2)).toMatchInlineSnapshot('"127.0.0.1:5000"')
  })

  test('test getNode(code3)', () => {
    const code3 = '58080'
    expect(cons.getNode(code3)).toMatchInlineSnapshot('"127.0.0.1"')
  })

  test('test whether the algorithm is evenly distributed', () => {
    const codes = ['04615', '00133', '29599', '00195', '61532', '42529', '80009', '79087', '94467', '96384', '09874', '72902', '91466', '10546', '97845', '43680', '65013', '80230', '53824', '47539', '27442', '01165', '46635', '13116', '53622', '05138', '69942', '89974', '30262', '70714', '93681', '75487', '19036', '33351', '95263', '95188', '26755', '23775', '94273', '07328', '46828', '61657', '85680', '60381', '32377', '67483', '54178', '22917', '45623', '94594', '85841', '46331', '64909', '64604', '86942', '03734', '37594', '41564', '42789', '41961', '59931', '15111', '94843', '73926', '57498', '57239', '38743', '64718', '63261', '72443', '74057', '72193', '60898', '51514', '51061', '60820', '07872', '19893', '65746', '64766', '26808', '82452', '45540', '13246', '54300', '44392', '46037', '86009', '09901', '71901', '78835', '13437', '66676', '90401', '02564', '62674', '78903', '80972', '08831', '44295']
    const nodes: Record<string, Array<string>> = {}

    codes.forEach((code) => {
      const node = cons.getNode(code)
      if (node) {
        if (nodes[node]) { nodes[node].push(code) }
        else {
          nodes[node] = []
          nodes[node].push(code)
        }
      }
    })
    const statistics: Record<string, number> = {}
    Object.keys(nodes).forEach((node) => {
      statistics[node] = nodes[node].length
    })
    expect(statistics).toMatchInlineSnapshot(`
      {
        "127.0.0.1": 38,
        "127.0.0.1:4000": 30,
        "127.0.0.1:5000": 32,
      }
    `)
  })
})

describe('set special vnodes', () => {
  const servers = [
    '127.0.0.1',
    {
      address: '127.0.0.1:4000',
      vnodes: 50,
    },
  ]

  const cons = new Hashring(servers, {
    vnodes: 20,
  })

  test('test nodes & vnodes count', () => {
    const nodes = cons.getNodes()
    const vnodesCount = cons.getRingVNodeCount()
    expect(nodes.length).toEqual(2)
    expect(nodes).toMatchInlineSnapshot(`
      [
        "127.0.0.1",
        "127.0.0.1:4000",
      ]
    `)
    expect(vnodesCount).toEqual(20 + 50)
  })
})
