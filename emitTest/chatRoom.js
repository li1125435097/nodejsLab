/**
 * 使用： 启动本服务后，可用多个 telnet localhost 8080 客户端测试聊天室功能
 */

const EventEmitter = require('events').EventEmitter
const net = require('net')
const channel = new EventEmitter()
const l = console.log

// 创建聊天室用户id对象和用户socket对象
channel.clients = {}
channel.suboptions = {}

// 订阅用户加入聊天室事件  用户加入时，备份用户id和用户socket，并订阅broadcast事件
channel.on('join',function(id, client) {
	this.clients[id] = client
	this.suboptions[id] = (sendid, msg) => {
		if(id !== sendid){this.clients[id].write(msg)}
	}
	this.on('broadcast', this.suboptions[id])
})

// 订阅用户离开聊天室事件，在订阅表移除此用户，并广播改用户离开聊天室
channel.on('leave', function(id){
	channel.removeListener('broadcast', this.suboptions[id])
	channel.emit('broadcast', id, `${id} has left chatroom`)
})

// 创建tcp服务器，当有用户连接时，发布加入事件，有用户输入数据时，发布广播事件
const server = net.createServer(client => {
	const id = `${client.remoteAddress}:${client.remotePort}`
	let msg = ''
	channel.emit('join', id, client)
	client.write('input please: \n')
	
	client.on('data', data => {
		channel.emit('broadcast', id, data.toString())
	})
	
	client.on('close', () => {
		channel.emit('leave', id)
	})
})

server.listen('8080')