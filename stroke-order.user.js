// ==UserScript==
// @name        WaniKani Stroke Order
// @version     0.0.1
// @description WaniKani userscript to add stroke order animations from Kanji alive
// @author      Tyler Lafayette
// @copyright   2019, Tyler Lafayette
// @license     MIT
// @namespace   http://tylerlafayette.com/
// @homepageURL https://github.com/TylerLafayette/wanikani-stroke-order
// @include     /^https?://(www\.)?wanikani\.com/review/session/?$/
// @grant       none
// ==/UserScript==

const stroke_order = {
	init: _ => {
		if(localStorage.getItem("kanji_alive_api_key") == null)
			localStorage.setItem("kanji_alive_api_key", prompt("Please enter your Kanji alive API key."))
		// Adapted from Jitai
		// https://community.wanikani.com/t/jitai-%E5%AD%97%E4%BD%93-the-font-randomizer-that-fits/12617
        const old = $.jStorage.set
        $.jStorage.set = function(key, value, options) {
            let ret = old.apply(this, [key, value, options])

            if (key === "currentItem") {
				// Split each character into one array element
				const kanji = (value.kan || value.voc || value.rad).split("")
				stroke_order.run(kanji)
            }

            return ret
		}
	},
	register_handlers: _ => {
		$(".ka-video").click(e => {
			e.target.currentTime = 0
			e.target.play()
		})
	},
	run: async kanji => {
		// Remove non-kanji characters
		kanji = kanji.filter(x => !x.match(/[a-zA-Z0-9]/g))
		let promises = kanji.map(i => stroke_order.getAnimationURL(i))
		let data = await Promise.all(promises)
		
		data = data.filter(x => x != null)

		$("#ka-wrapper").remove()
		$("#question").append(`<div id="ka-wrapper" style="position:absolute;top:0;width:100%;height:64px;display:flex;align-items:center;justify-content:center;">${data.map(i => `<video class="ka-video" width=58 height=58 style="box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3); margin-left: 4px;margin-right:4px;" autoplay=true loop=true src=${i}></video>`)}</div>`)
		stroke_order.register_handlers()
	},
	getAnimationURL: async kanji => {
		const request = await fetch(`https://kanjialive-api.p.rapidapi.com/api/public/kanji/${encodeURI(kanji)}`, {
			headers: {
				"X-RapidAPI-Key": localStorage.getItem("kanji_alive_api_key"),
				"X-RapidAPI-Host": "kanjialive-api.p.rapidapi.com"
			}
		})
		const json = await request.json()
		if(json.mp4_video_source) return json.mp4_video_source
		if(json.kanji && json.kanji.video) return json.kanji.video.mp4
		return null
	}
}

$(document).ready(stroke_order.init)