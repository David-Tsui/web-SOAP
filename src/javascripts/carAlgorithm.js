'use strict'
/* This code looks like a shitttttt */
/* Thus, I recommend anyone who wants to use it to rewrite by Vue.js with Lodash or ES6. */

$(document).ready(function() {
	/**************************************************** Init ***************************************************/
	showBrowserPrompt();
	initialSemanticUIComponent();
	$('body').attr('oncontextmenu','return false;');

	var carImageObj = {}, sticky_cards = [];
	var items = [], prices = {}, carSize = "";
	var JSON_PATH = {
		carCheck   : './assets/resources/carCheck.json',
		carImage   : './assets/resources/carImage.json',
		carPrice   : './assets/resources/carPrice.json',
		carSolution: './assets/resources/carSolution_ppt.json',
	}

	// promises
	function getCarImage() { return $.getJSON(JSON_PATH.carImage); }
	function getCarCheck() { return $.getJSON(JSON_PATH.carCheck); }
	function getCarPrice() { return $.getJSON(JSON_PATH.carPrice); }
	function getCarSolution() { return $.getJSON(JSON_PATH.carSolution); }

	/************************************************* UI control *************************************************/
	// navbar
	$('.right.menu.open').on("click",function(e){
		e.preventDefault();
		var navbar_height = $(".mobile.only.row > .ui.menu.navbar").height();
		$('#mobile_navbar').css("top", navbar_height + 4).toggle();
	});
	// qrcode
	$('.myQrcode').on('click', function(){
		$(this).transition('jiggle');
	});

	$("#btn-submit-opinion").on('click', function(){
		$("#loadingMsg1").fadeIn();
		var getFieldValue = function(fieldName) {
			var text = $('#question-form').form('get value', fieldName);
			if (text != "")
				return text;
			return "無";
		};
		var formData = {
			Timestamp  : "",
			聯絡email  : getFieldValue('contact-email'),
			回報內容   : getFieldValue('report-content'),
			版本       : "匯豐"
		};
		var api = "https://script.google.com/macros/s/AKfycbyhfC8jD3xkQNZT-GdqLiZObU0gb1qxPeqfBKOVmkL9PzGzgOM/exec";
		$.post(api, formData, function(res){
			console.log("res: ", res);
			$("#loadingMsg1").fadeOut(function(){
				$("#successMsg1").fadeIn().delay(3500).fadeOut();
			});
		});											
	});

	var handleSidebar = function(e) {
		var eventClass   = e.target.className;
		var class_arr    = eventClass.split(" ");
		var active_class = class_arr[class_arr.length - 1];
		var items = $("#sidebar-tab a");
		var tabs  = $(".ui.tab.segment");

		for(var i = 0; i < items.length; i++) {
			$(items[i]).removeClass("active");
			$(tabs[i]).removeClass("active");
			if ($(items[i]).attr("data-tab") == active_class) {
				$(items[i]).addClass("active");
				$(tabs[i]).addClass("active");
			}
		}
		$("#sidebar-tab .item").tab();

		$("body").removeClass("pushable");
		$("body").addClass("pushable");
		$('.ui.sidebar').sidebar('setting', 'transition', 'uncover').sidebar('toggle');
		$('.ui.sidebar').first().sidebar('attach events', '.btn-close-sidebar', 'hide');

		// some hack
		var timer = setInterval(checkSidebarVisible, 50);

		function checkSidebarVisible() {
			if ($('.ui.sidebar').sidebar('is visible')) {
				clearInterval(timer);
				timer = false;
				$(".pusher.dimmed, .btn-close-sidebar").one('click', function(e) {
					$(".pusher.dimmed, .btn-close-sidebar").off("click");
					var timer = setInterval(checkSidebarHidden, 50);

					function checkSidebarHidden() {
						var check = $('.ui.sidebar.uncover');
						if (check.length == 0) {
							clearInterval(timer);
							timer = false;
							$("body").removeClass("pushable");
						}
					}
				})
			}
		}
	}
	$(".intro-open, .howto-open, .reply-open").click(handleSidebar);

	/*************************************** 第一部分 ── 讀入json，將dropdown建出 *****************************************/
	getCarImage().done(function(data) { carImageObj = data; });
	getCarCheck().done(function(data) {
		// initialize dropdown
		$("#sizeDropdown").dropdown();
		// loading dropdown content
		var temp_condition = "";
		data.forEach(function(element, count) {
			temp_condition = element.condition;
			var obj_len = temp_condition.length;
			var list = "";
			temp_condition.map(function(ele, index) {
				var divide_flag = false;
				var ret = "";
				var type_arr = ele.type;
				if (type_arr.length > 1) {
					var header = '<div class="header" style="font-size: 1.15em"><i class="tags icon"></i>' + ele.kind + '</div>'
					ret += header;
					divide_flag = true;
				}
				type_arr.forEach(function(element, index) {
					var item = '<div class="item" data-value=' + element.name + '>' + element.name + '</div>';
					ret += item;
				})
				if (divide_flag && (index < obj_len - 1)) {
					var divider = '<div class="divider"></div>';
					ret += divider;
				}
				list += ret;
			});
			var title = '<div class="ui header">' + element.diagnosis + '</div>';
			var dropdown = '<div class="ui fluid multiple selection dropdown" id="dropdown' + (count + 1) + '">' +
				'<input type="hidden" name="country" />' +
				'<i class="dropdown icon"></i>' +
				'<div class="default text">請選擇狀況</div>' +
				'<div class="menu">';
			dropdown += list + "</div></div>";
			var content = title + dropdown;
			$("#segment" + (count + 1)).html(content);
			$("#dropdown" + (count + 1)).dropdown();
		});

		// setting dropdown style and behaviour
		var highLight = function(e) {
			var caller = e.target;
			var parentBox = $(caller).parents(".dropDownBox");
			parentBox.addClass("active");
			parentBox.mouseleave(function(){
				$(this).removeClass("active");
			});
		}
		$('.ui.selection .menu').css('max-height', 13.585714 + "rem");
		$(".ui.selection.dropdown").on('click mouseenter', highLight);
 
		$(".ui.multiple.dropdown .item").click(function(e) {
			var caller_item = $(e.target).attr("data-value");
			addCard(caller_item, carImageObj, sticky_cards);
			// a hack to wait the dropdown item shows up
			setTimeout(function(){
				$('.ui.label.transition.visible').off('click').on('click', function(e) {
					var caller = e.target;
					var condition = $(caller).attr("data-value");
					if (condition === undefined) return;
					$("#modal-header").html(condition);

					$("#image-place").html("");
					var images_len  = carImageObj.length;
					var image_paths = searchImages(condition, carImageObj);
					image_paths.forEach(function(path) {
						$("#image-place").append(
							'<img src="' + path + '" alt="image not found" class="condition-image" />' + '<br>'
						);
					})
					$("#image-place img").on('load', function(){ // 等圖片load完才跳出modal
						$('#image-modal').modal('setting', {
							transition: "horizontal flip",
						}).modal('show');
					});
				});
				$("#image-modal-closeBtn").on("click", function(){
					$("#image-modal").modal('toggle');
					setTimeout(function(){
						$("#image-place").html("");
					}, 300);
				});

			}, 400);
		});
	});
	$("#clearAll").on('click', function(){
		$('.ui.fluid.multiple.dropdown').dropdown('clear');
		$('.second, .third').hide();
		scrollToDropdown();
		$("#card-container-monitor, #card-container-mobile").empty();
		$(".sticky-default-text").removeClass("not-empty");
		$('.ui.sticky').sticky('refresh');
		sticky_cards = [];
	});
	$("#goAhead").on('click', function(){
		var exterior = [[],[]], interior = [], coating = "", attach = "", broken = "";
		carSize = $("#sizeDropdown").dropdown('get value');
		var recommend = {
			exterior: {
				good      : "",
				better    : "",
				best      : "",
				additional: []
			},
			interior: {
				good      : "",
				better    : "",
				best      : "",
				additional: []
			},
			glass: {
				good      : "",
				better    : "",
				best      : "",
				additional: []
			}
		};
		var all_blank = true;
		for(var i = 1; i <= 6; i++) {
			var dropdown_value = $("#dropdown" + i).dropdown('get value');
			if (dropdown_value !== "") {
				all_blank = false;
				var arr = dropdown_value.split(",");
				if (i <= 2) exterior[i - 1] = arr;
				else if (i == 3) coating = arr[0];
				else if (i == 4) interior = arr;
				else if (i == 5) attach = arr[0];
				else broken = arr[0];
			}
		}
		if (carSize == "") {
			alert("您尚未選取車型!!");
			scrollToDropdown();
			return;
		}
		if (all_blank) {
			alert("您尚未選取任何狀況!!");
			scrollToDropdown();
			return;
		}
		/******************************************* 第二部分 ── 開始主要algorithm ****************************************/
		$.when($.getJSON(JSON_PATH.carCheck), $.getJSON(JSON_PATH.carSolution)).done(function(data1, data2) {
			data1 = data1[0];
			data2 = data2[0];
			var temp_result = [];
			for(var k = 0; k < 6; k++) {
				var obj = data1[k].condition;
				if (k <= 2) { // 處理車身問題
					if (k <= 1) {
						if (exterior[k] !== undefined) {
							exterior[k].forEach(function(name) { // dropdown中的狀況
								temp_result.push(getSolution(obj, name));
							})
						}
						if ((k == 0 && (exterior[1] === undefined)) || (k == 1 && exterior[k] !== undefined)) {
							var temp_arr = [];
							for(var i = 0; i < temp_result.length; i++) 
								temp_arr = temp_arr.concat(temp_result[i]);
							temp_arr.sort(function(a, b) {
								var standard_order = [
									{name: "飛漆污染嚴重者視車況估價", score: 0},
									{name: "水泥污染嚴重者視車況估價", score: 1},
									{name: "皮椅發霉嚴重者視車況估價", score: 2},
									{name: "口香糖沾黏嚴重者視車況估價", score: 3},
									{name: "陳年污垢嚴重者視車況估價", score: 4},
									{name: "若跳石已傷至色漆層，則建議烤漆", score: 5}, 
									{name: "若漆面已刮傷至色漆層，建議局部補漆或烤漆", score: 6},
									{name: "若龜裂狀況已傷至色漆層，則須以汽車烤漆處理", score: 7},
									{name: "若橘皮化太嚴重，建議烤漆", score: 8},
									{name: "塗裝不良區域請洽鈑噴中心", score: 9},
									{name: "打腊", score: 90},
									{name: "精緻打腊", score: 91},
									{name: "優質美容", score: 92},
									{name: "優質鍍膜", score: 93},
									{name: "精緻美容", score: 94}, 
									{name: "精工鍍膜", score: 95}, 
									{name: "白金車體鍍膜", score: 96}
								];
								var score_a = 0, score_b = 0;
								var arr_len = standard_order.length;
								for(var i = 0; i < arr_len; i++) {
									if (a == standard_order[i].name) score_a = standard_order[i].score;
									if (b == standard_order[i].name) score_b = standard_order[i].score;
								}
								return score_a - score_b;
							});
							var good = "", better = "",	best = "", additional = [];
							temp_arr = getAllContain(temp_arr, temp_result.length);
							if (temp_arr[0].length >= 3) {
								good = temp_arr[0][0];
								better = temp_arr[0][1];
								best = temp_arr[0].pop();
							} else if (temp_arr[0].length <= 2) {
								good = [temp_arr[0][0]];
								if (temp_arr[0][1] !== undefined)
									better = temp_arr[0][1];
							}
							additional = temp_arr[1]
							recommend.exterior.good = good;
							recommend.exterior.better = better;
							recommend.exterior.best = best;
							recommend.exterior.additional = additional;
						}
					} else {
						if (coating !== "") {
							var temp_result = getSolution(obj, coating);
							recommend.exterior.additional.push(temp_result[0]);
						}
					}
				} else if (k == 3 && interior.length > 0) {
					temp_result = [];
					interior.forEach(function(name) { // dropdown中的狀況
						temp_result.push(getSolution(obj, name));
					})
					var temp_arr = [];
					for(var i = 0; i < temp_result.length; i++) 
						temp_arr = temp_arr.concat(temp_result[i]);										
					temp_arr.sort(function(a, b) {
						var standard_order = [
							{name: "方向盤清洗護理", score: 0}, 
							{name: "安全帶清洗護理", score: 1}, 
							{name: "冷排抗菌", score: 2}, 
							{name: "半套內裝清洗護理", score: 3}, 
							{name: "全套內裝清洗護理", score: 4}, 
							{name: "半套內裝清洗護理+冷排抗菌", score: 5}, 
							{name: "全套內裝清洗護理+冷排抗菌", score: 6}
						];
						var score_a, score_b;
						var arr_len = standard_order.length;
						for(var i = 0; i < arr_len; i++) {
							if (a == standard_order[i].name)
								score_a = standard_order[i].score;
							if (b == standard_order[i].name)
								score_b = standard_order[i].score;
						}
						return score_a - score_b;
					});

					var good = "", better = "",best = "",	additional = [];
					temp_arr = getAllContain(temp_arr, temp_result.length);
					if (temp_arr[0].length >= 3) {
						good = temp_arr[0][0];
						better = temp_arr[0][1];
						best = temp_arr[0].pop();
					} else if (temp_arr[0].length <= 2) {
						good = [temp_arr[0][0]];
						if (temp_arr[0][1] !== undefined)
							better = temp_arr[0][1];
					}
					additional = temp_arr[1];
					recommend.interior.good = good;
					recommend.interior.better = better;
					recommend.interior.best = best;
				} else if (k == 4 || k == 5) {
					var temp_result = [];
					if (k == 4 && attach !== "") {
						temp_result = getSolution(obj, attach);
						recommend.glass.good = temp_result[0];
						recommend.glass.better = temp_result[1];
						attach = "";
					}
					if (k == 5 && broken !== "") {
						temp_result = getSolution(obj, broken);
						recommend.glass.additional = temp_result;
						broken = "";
					}
				}
			}
			/* 開始新增table content */
			var keys = Object.keys(recommend);
			var text = "";
			keys.forEach(function(key, index) {	
				var temp_obj = recommend[key];
				var subkeys = Object.keys(temp_obj);
				var arr = ["車身", "內裝", "玻璃"];
				text += '<tr>';
				text += '<td>' + arr[index] + '</td>';
				for(var i = 0; i < 4; i++) {
					var subkey = subkeys[i];
					var temp = temp_obj[subkey];
					var data_len = data2.length;
					var path = "";
					for(var k = 0; k < data_len; k++) {
						if (data2[k].name == temp) {
							path = data2[k].url;
							break;
						}
					}
					if (i == 3) { // 特殊狀況建議，回傳是陣列
						text += '<td>';
						temp.forEach(function(conds, index) {
							if (index < (temp.length - 1)) {
								text += '<p class="emphasized">' + conds + '</p>' + '<br>';
							} else {
								text += '<p class="emphasized">' + conds + '</p>';
							}
						})
						text += "</td>";
					} else {
						if (temp == "") { // 如果是空陣列，空出一格
							text += '<td></td>';
						}	else {
							if ((path != "") && (path != "not found")) {
								// text += '<td><a href="plugin/pdfresources/viewer.html?path=../../' + path + '" target="_blank">' + temp + '</a></td>';
								text += '<td><a href="' + path + '" target="_blank">' + temp + '</a></td>';
							} else {
								text += '<td>' + temp + '</td>';
							}
						}
					}
				}
			})
			text += '</tr>';
			$("#calculate-content").html(text);
			/* 填美車週期表，價格對應車型，並把該json存進prices全域變數 */
			getCarPrice().done(function(data) {
				data.forEach(function(item) {
					var key = Object.keys(item);
					var temp_arr = item[key[0]];
					var insertTable = '<table class="ui unstackable three column celled striped table"><thead>';
					insertTable += '<tr><th>美容項目</th><th>建議回廠月份</th><th><span class="span-carSize"></span>價格</th></tr></thead><tbody>';
					temp_arr.forEach(function(element) {
						insertTable += "<tr>";
						insertTable += "<td>" + element.name + "</td>";
						insertTable += "<td>" + element.period + "</td>";
						if (element.price[carSize] != 0)
							insertTable += "<td>" + element.price[carSize] + "</td>";
						else 
							insertTable += "<td> - </td>";
						insertTable += "</tr>";
					})			
					insertTable += '</tbody></table>';
					$("#" + key[0] + "-tab").html(insertTable);
				})
				$("#period-tab .item").tab();
				var arr = [];
				data.forEach(function(item) {
					var key = Object.keys(item);
					var temp_arr = item[key[0]];
					arr = arr.concat(temp_arr);
				})
				prices = arr;
			});

			/************************************** 第三部分，將美容項目匯入dropdown ************************************/
			var fillDropdown = function(){
				$(".ui.fluid.dropdown.refreshDropdown").parents(".field").addClass("required");
				var exterior = "exterior-field", interior = "interior-field",	glass = "glass-field";
				var id_arr = [exterior, interior, glass];
				var obj_arr = [recommend.exterior, recommend.interior, recommend.glass];
				var ret_validation_rule = {};
				obj_arr.forEach(function(obj, i) {
					var keys = Object.keys(obj);
					var options = '<option value="">請選擇美容項目</option>' + '<option value="未做推薦項目" style="color: #F00">**未做推薦項目**</option>';
					var empty_flag = true;
					keys.forEach(function(key, j) {
						if (j < keys.length - 1 && obj[key] != "") {
							options += '<option value="' + obj[key] + '">' + obj[key] + '</option>';
							empty_flag = false;		
						}
					})
					if (empty_flag) {
						options = '<option value="">無項目可選擇，請略過</option>';
						$('#' + id_arr[i]).parents(".field").removeClass("required");
						$('#' + id_arr[i]).dropdown("set text", options).addClass("disabled");
					} else {
						$('#' + id_arr[i]).dropdown("set text", '<option value="">請選擇美容項目</option>');
						var rule_obj = {
							identifier: id_arr[i],
							rules: [
								{
									type   : 'empty',
									inline : true,
									prompt : '請選擇或是輸入!'
								}
							]
						}
						ret_validation_rule[id_arr[i]] = rule_obj;
					}
					$('#' + id_arr[i]).html(options);
					$('#' + id_arr[i]).dropdown("refresh");
					setTimeout(function() {
						$('#' + id_arr[i]).siblings(".menu").children(".item:first-child").css({'color': '#f00', 'font-weight': 700});
					}, 250);
					$('#' + id_arr[i]).dropdown('save defaults');
				})
				
				$(".ui.fluid.dropdown.refreshDropdown .menu").css('max-height', 13.585714 + "rem");
				return ret_validation_rule;
			};

			var formHandle = function(rules_obj) {
				/* validation */
				$("#report-form").form({ 
					fields: rules_obj,
					onSuccess: submitForm
				});

				/* form handle*/
				var checkbox_state = [true, false];
				var enable_field_doer = ['#tech-field', '#customer-field'],
					enable_field_executed = "#date-field";
				$('.ui.radio.checkbox.doer').checkbox({
					 onChange: function(){
						checkbox_state = $(".ui.radio.checkbox.doer").checkbox("is checked");
						checkbox_state.forEach(function(flag, i) {
							if (i == 1 && flag) {
								$(enable_field_doer[i - 1]).removeClass("required");
								$(enable_field_doer[i - 1]).children('input').removeAttr("required");
							} else if (i == 0 && flag) {
								$(enable_field_doer[i]).addClass("required");
								$(enable_field_doer[i]).children('input').attr("required", "");
							}
						});
					}
				});

				$('.ui.radio.checkbox.executed').checkbox({
					 onChange: function(){
						checkbox_state = $(".ui.radio.checkbox.executed").checkbox("is checked");
						checkbox_state.forEach(function(flag, i) {
							if (!flag) {
								// pass
							} else {
								if (i == 1) {
									$(enable_field_executed).removeClass("required");
									$(enable_field_executed).children('input').removeAttr("required");
								} else if (i == 0) {
									$(enable_field_executed).addClass("required");
									$(enable_field_executed).children('input').attr("required", "");
								}
							}
						});
					}
				});

				$("#span-date").html(
					'(範例:  ' + '<a href="#" id="setDate">' + getCurrentDate() + '</a>' + 
					'，若未施工請略過。)'
				);
				// 取消form default submit
				$("#report-form").submit(function(e) {
					return false;
				});

				// 快速設定日期button
				$("#setDate").click(function(){
					setDateField(getCurrentDate());
					return false;
				});
				// 估價button
				$("#btn-evaluate").off('click').on('click', function(){
					var price_result = calculatePrice(carSize, getFieldValue('exterior-field'), getFieldValue('interior-field'), getFieldValue('glass-field'));
					$("#price-result-field").val(price_result);
				});
				// 重填button
				$("#btn-reset").off('click').on('click', function() {
					clearResultForm();
				});

				function getCurrentDate() {
					var myDate = new Date();
					var year   = myDate.getFullYear();
					var day    = myDate.getDate();
					var month  = myDate.getMonth() + 1;
					return year + "/" + month + "/" + day;
				}

				function setDateField(dateString) {
					$('#report-form').form('set value', 'date-field', dateString);
				}

				function getFieldValue(field_name) {
					var text = $('#report-form').form('get value', field_name);
					if (text != "")
						return text.trim();
					return "無";
				}

				function calculatePrice(size, a, b, c) {
					var sum = 0;
					if (b == "半套內裝清洗護理 + 冷排抗菌") {
						var str1 = "半套內裝清洗護理", str2 = "冷排抗菌";
						for(var i = 0; i < prices.length; i++) {
							var obj = prices[i];
							if (obj.name == str1 || obj.name == str2) {
								sum += obj.price[size];
							}
						}
					} else if (b == "全套內裝清洗護理 + 冷排抗菌") {
						var str1 = "全套內裝清洗護理", str2 = "冷排抗菌";
						for(var i = 0; i < prices.length; i++) {
							var obj = prices[i];
							if (obj.name == str1 || obj.name == str2) {
								sum += obj.price[size];
							}
						}
					}
					for(var i = 0; i < prices.length; i++) {
						var obj = prices[i];
						if (obj.name == a || obj.name == b || obj.name == c) {
							sum += obj.price[size];
						}
					}
					return sum;
				}

				function submitForm() {
					$("#btn-submit").addClass('disabled');
					$("#successMsg").hide(function(){$("#loadingMsg").show();});
					var additionals = [];
					for(var key in recommend) {
						additionals.push(recommend[key].additional);
					}
					additionals.forEach(function(add_arr, i) {
						if (add_arr.length > 0) {
							var temp = "";
							add_arr.forEach(function(ele, j) {
								if (j < add_arr.length - 1) {
									temp += ele + ",";
								}	else {
									temp += ele;
								}
							})
							add_arr = temp;
						}	else {
							add_arr = "無";
						}
						additionals[i] = add_arr;
					})
					var price_result = calculatePrice(carSize, getFieldValue('exterior-field'), getFieldValue('interior-field'), getFieldValue('glass-field'));
					$("#price-result-field").html(price_result);
					var formData = {
						登打日期  	: "",
						健檢人員  	: getFieldValue('doer-field'),
						技師姓名  	: getFieldValue('tech-field'),
						車主姓名  	: getFieldValue('customer-field'),
						是否施工  	: getFieldValue('executed-field'),
						施工日期  	: getFieldValue('date-field'),
						廠別    		: getFieldValue('place-field'),
						車號    		: getFieldValue('number-field'),
						車色    		: getFieldValue('color-field'),
						客戶姓名  	: getFieldValue('customer-field'),
						聯絡電話 		: getFieldValue('phone-field'),
						車型    		: carSize,
						漆面處理  	: getFieldValue('exterior-field'),
						內裝處理  	: getFieldValue('interior-field'),
						玻璃處理  	: getFieldValue('glass-field'),
						漆面特殊情形: additionals[0],
						內裝特殊情形: additionals[1],
						玻璃特殊情形: additionals[2],
						估價    		: getFieldValue('price-result-field'),
						施工美容項目: getConfirmProduct(getFieldValue('exterior-field'), getFieldValue('interior-field'), getFieldValue('glass-field')),
						備註    		: getFieldValue('ps-field')
					};

					var api = "https://script.google.com/macros/s/AKfycbypisEwEHGYDf7hwXKhLHih_LnOGHqb9Tt6YLnblnZXy48jZXlB/exec";
					$.post(api, formData, function(response) {
						console.log(response);
						$("#loadingMsg").fadeOut(function(){
							$("#successMsg").fadeIn(function(){
								$("#btn-submit").removeClass('disabled');
							}).delay(3500).fadeOut();
						});
					}).fail(function(xhr, textStatus, errorThrown) {
						$("#loadingMsg").fadeOut(function(){
							$("#failMsg").fadeIn().delay(3500).fadeOut();
						});
					});
					formData["經銷商"] = "匯豐";
					var api_origin = "https://script.google.com/macros/s/AKfycbw1ZBTp7wLQXmKHS6oMHVWTAcRtY7rmvCKAKMuOdi_XwvUni6Iq/exec";
					$.post(api_origin, formData, function(response) {
						console.log(response);
					});
				}
				var options = {
					animateThreshold: 100,
					scrollPollInterval: 20
				};
				$(".second").show(0, function(){
					$(".second-animate").addClass("aniview fast");
					$('.aniview').AniView(options);
					scrollToSecond();
				});
				$(".third").show(0, function(){
					$(".third-animate").addClass("aniview fast");
					$('.aniview').AniView(options);
				});
			};
			$(".ui.fluid.dropdown.refreshDropdown").dropdown({allowAdditions: true});
			var ret_rules = fillDropdown();
			formHandle(ret_rules);
			$('.ui.sticky').sticky('refresh');
		});
	});
});

var getSolution = function(obj, problem) { // 找出對應problem的所有解法，回傳2D array
	var ret = [];
	for(var i = 0; i < obj.length; i++) {
		var temp_obj = obj[i].type; // 抓出type array
		for(var j = 0; j < temp_obj.length; j++) { // 遍歷該type array中所有elements，有對應狀況便抓出solution
			if (temp_obj[j].name == problem) {
				return temp_obj[j].solution;
			}
		}
	}
}
var getAllContain = function(array, condition_num) { // 得到所有問題之共同解，回傳2D array，分good跟additional兩項
	var good = [], additional = [];
	var arr1 = [
		"若漆面已刮傷至色漆層，建議要局部補漆或烤漆", "若橘皮化太嚴重，建議烤漆", "飛漆污染嚴重者視車況估價", "水泥污染嚴重者視車況估價",
		"皮椅發霉嚴重者視車況估價", "口香糖沾黏嚴重者視車況估價", "陳年污垢嚴重者視車況估價"
	];
	var arr2 = ["若跳石已傷至色漆層，則建議烤漆", "若龜裂狀況已傷至色漆層，則須以汽車烤漆處理", "若有塗裝不良，請洽鈑噴中心", "請洽原廠更換玻璃"];
	for(var i = 0; i < array.length; i++) {
		var item = array[i];
		if (arr1.indexOf(item) != -1) {
			additional.push(item);
		} else if (arr2.indexOf(item) != -1) { // 特殊情形
			additional.push(item);
			condition_num--;
		} else if (item == "半套內裝清洗護理 + 冷排抗菌") { // 特殊情形
			good = [];
			good.push(item);
			good.push("全套內裝清洗護理 + 冷排抗菌");
			break;
		} else {
			var count = 1;
			for(var j = i + 1; j < array.length; j++) {
				if (array[j] == item) // 將已串起且排序過的陣列中元素計數
					count++;
				if (count == condition_num) { // 若計數達所有問題之數目，即為共同解
					good.push(item);
					break;
				}
			}
		}
	}
	var ret = [];
	ret.push(good);
	ret.push(additional);
	return ret;
}

function addCard(condition, carImageObj, sticky_cards) {
	var card = $("#card-template").clone().removeAttr("id").css('display', 'block');
	var img_path = searchImages(condition, carImageObj);
	card.find(".image img").attr("src", img_path[0]);
	card.find(".content .header").html(condition).off('click').on('click', function(e) {
		var caller = e.target;
		var value = $(caller).html();
		$("#modal-header").html(value);

		$("#image-place").html("");
		var img_path = searchImages(value, carImageObj);
		img_path.forEach(function(path) {
			$("#image-place").append(
				'<img src="' + path + '" alt="image not found" class="condition-image" />' + '<br>'
			);
		})
		
		$("#image-place img").on('load', function(){ // 等圖片load完才跳出modal
				$('#image-modal').modal('setting', {
					transition: "horizontal flip",
				}).modal('show');
			});

		$("#image-modal-closeBtn").on("click", function(){
			$("#image-modal").modal('toggle');
			setTimeout(function(){
				$("#image-place").html("");
			}, 300);
		});
	});
	$('.ui.sticky').sticky('refresh');
	card.addClass('magictime puffIn');
	if (sticky_cards.length == 0) {
		$(".sticky-default-text").addClass("not-empty");
	}
	sticky_cards.push(card);
	console.log("add card");
	$("#card-container-monitor, #card-container-mobile").append(card);
}

function searchImages(condition, carImageObj) {
	var len = carImageObj.length;
	var paths = [];
	for(var i = 0; i < len; i++) {
		if (carImageObj[i].name == condition) {
			paths = carImageObj[i].src;
			return paths;
		}
	}
}

function scrollToDropdown() {
	$("body").animate({
		scrollTop: $('#segment0').offset().top - 50
	}, 600);
}

function scrollToSecond() {
	$("body, html").animate({scrollTop: $('.second').offset().top}, 500);
}

function showBrowserPrompt() {
	var browser = checkBrowser();
	$("#checkBrowser").html(
		"<span>當前瀏覽器為" + browser.Name + "，版本為" + browser.Ver + "</span>" + "<br>" + 
		"<span>推薦使用Chrome，版本40以上</span>"
	);
}

function getConfirmProduct(exterior, interior, glass) {
	var sol = [exterior, interior, glass], ret_str = "";
	sol.forEach(function(str, i) {
		if (!str || str == "無") {
		} else {
			ret_str += str + "、";
		}
	});
	if (ret_str.charAt(ret_str.length - 1) == "、")
		ret_str = ret_str.substr(0, ret_str.length - 1);
	return ret_str;
}

function initialSemanticUIComponent() {
	$('.ui.sticky').sticky({ 
		offset: 70,
		context: '#stickyCol'
	});
	$('.ui.radio.checkbox').checkbox();
}

function clearResultForm() {
	// radio button
	$('input:radio[name="doer-field"]').filter('[value="技師"]').attr('checked', true);
	$('input:radio[name="executed-field"]').filter('[value="是"]').attr('checked', true);
	
	// input text, textarea
	$("#tech-field, #date-field, #place-field, #customer-field, #number-field, #color-field, #phone-field, #ps-field, #price-result-field").val("");
	
	// dropdown
	$("#exterior-field").dropdown('set text', $("#exterior-field").children('option:first-child').text());
	$("#interior-field").dropdown('set text', $("#interior-field").children('option:first-child').text());
	$("#glass-field").dropdown('set text', $("#glass-field").children('option:first-child').text());
}