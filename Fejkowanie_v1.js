//CommandPopup.openRallyPoint({target:15});
//CommandPopup.SenderSelection.choose('10');
var fileref=document.createElement("link");
fileref.setAttribute("rel", "stylesheet");
fileref.setAttribute("type", "text/css");
fileref.setAttribute("href", '/css/game/village_target.css');
document.getElementsByTagName("head")[0].appendChild(fileref);
$.getScript('/js/game/CommandPopup.js');
$.getScript('/js/game/TroopTemplates.js');
$.getScript('/js/game/TargetSelection.js');

if(localStorage.indeks_ostatnio_atakowanej){
	localStorage.indeks_ostatnio_atakowanej = "";
	localStorage.fejkownik = "";
}
var fejkownik = {
	
	link: (game_data.player.sitter != 0?("/game.php?t=" + game_data.player.id):"/game.php?")+"&village="+game_data.village.id+"&type=own_home&mode=units&group=0&page=-1&screen=overview_villages",
	min_indeks: 0,
	co_robic: 0,
	
	dane:{
		min_godz: 7,
		max_godz: 23,
		maks_atakow: 15,
		odswiezanie: 200,
		atk_na_gracza: 3,
		konkretny_dzien: 0,
		ostatnio_atakowana: 0,
		wlasne: [],
		cele: [],
		predkosc: 30
	},
	pobierz_wlasne_wioski: function() {
		var r = new XMLHttpRequest();
		r.open('GET', this.link, true);
		r.onreadystatechange = function(){
			if (r.readyState == 4 && r.status == 200){
				requestedBody = document.createElement("body");
				requestedBody.innerHTML = r.responseText;
				tabela = $(requestedBody).find('#units_table').get()[0];
				var kopia = fejkownik.dane.wlasne;
				for(i=1,n=0;i<tabela.rows.length;i++){
					var tmp_wojska = [];
					var wspolrzedne = tabela.rows[i].cells[0].getElementsByTagName('span')[2].textContent.match(/\d+/g);
					for(j=2;j<tabela.rows[i].cells.length-2;j++){
						tmp_wojska.push(tabela.rows[i].cells[j].textContent);
					}
					if(tmp_wojska[8] === "0" && tmp_wojska[9] === "0") continue;
					id = tabela.rows[i].cells[0].getElementsByTagName('span')[0].getAttribute("data-id");
					fejkownik.dane.wlasne[n++] = {
						id:id,
						x:wspolrzedne[wspolrzedne.length-3],
						y:wspolrzedne[wspolrzedne.length-2],
						atakowane_wioski:[],
						atakowani_gracze:[],
						wojska:tmp_wojska,
					};
				}
				if(kopia.length)
					for(i=0;i<fejkownik.dane.wlasne.length;i++)
						for(j=0;j<kopia.length;j++)
							if(fejkownik.dane.wlasne[i].id == kopia[j].id){
								fejkownik.dane.wlasne[i].atakowani_gracze = kopia[j].atakowani_gracze;
								fejkownik.dane.wlasne[i].atakowane_wioski = kopia[j].atakowane_wioski;
								break;
							}
						
				
			}
		}
		r.send(null);
	},
	czas_drogi: function(zrodlo,cel){
		a = Math.abs(parseInt(zrodlo.x) - parseInt(cel.x));
		b = Math.abs(parseInt(zrodlo.y) - parseInt(cel.y));
		return Math.sqrt((a * a) + (b * b)) * fejkownik.dane.predkosc*60;
	},
	atakuj_wioske: function(){
		
		var t = $('#serverTime').html().match(/\d+/g);
		var d = $('#serverDate').html().match(/\d+/g);
		var obecnyCzas = new Date(d[2],d[1]-1,d[0],t[0],t[1],t[2]);
		if(fejkownik.dane.ostatnio_atakowana >= fejkownik.dane.maks_atakow*fejkownik.dane.cele.length){alert("WysĹaĹem wszystkie rozkazy lub wykorzystaĹem moĹźliwoĹci. ZmieĹ numer rokazu aby wznowiÄ lub podaj nowe wspĂłĹrzÄdne Ĺźeby zaczÄÄ od nowa."); localStorage.setItem('fejkownik', JSON.stringify(fejkownik.dane)); return;}  ///////////
		var indeks = fejkownik.dane.ostatnio_atakowana%fejkownik.dane.cele.length;
		if(fejkownik.dane.cele[indeks].ilosc_atakow >= fejkownik.dane.maks_atakow){
			fejkownik.dane.ostatnio_atakowana++;
			fejkownik.atakuj_wioske();
			return;
		}
		var min = fejkownik.dane.max_godz+1;
		fejkownik.min_indeks = -1;
		for(i=0, koniec=fejkownik.dane.wlasne.length; i<koniec; i++){
			if(fejkownik.dane.wlasne[i].id == fejkownik.dane.cele[indeks].id) continue;
			if(fejkownik.dane.wlasne[i].wojska[9] =="0" && fejkownik.dane.wlasne[i].wojska[8]=="0") continue;
			if(fejkownik.dane.wlasne[i].atakowane_wioski.indexOf(fejkownik.dane.cele[indeks].id) != -1) continue;
			if(fejkownik.ilosc_wystapen(fejkownik.dane.wlasne[i].atakowani_gracze,fejkownik.dane.cele[indeks].wlasciciel)>2) continue;
			var podroz_w_sek = fejkownik.czas_drogi(fejkownik.dane.wlasne[i],fejkownik.dane.cele[indeks]);
			var czas_wejscia = new Date(obecnyCzas.getTime() + (podroz_w_sek*1000));
			if((!fejkownik.dane.konkretny_dzien && czas_wejscia.getHours()<min && czas_wejscia.getHours()>=fejkownik.dane.min_godz) || (fejkownik.dane.konkretny_dzien == czas_wejscia.getDate() && czas_wejscia.getHours()<min && czas_wejscia.getHours()>=fejkownik.dane.min_godz )){
				min = czas_wejscia.getHours();
				fejkownik.min_indeks = i;
				if(min == fejkownik.dane.min_godz)
					break;
			}
		}
		fejkownik.dane.ostatnio_atakowana++;
		if(min>fejkownik.dane.max_godz) 
			fejkownik.atakuj_wioske();
		else{
			fejkownik.dane.wlasne[fejkownik.min_indeks].atakowani_gracze.push(fejkownik.dane.cele[indeks].wlasciciel);
			fejkownik.dane.wlasne[fejkownik.min_indeks].atakowane_wioski.push(fejkownik.dane.cele[indeks].id);
			fejkownik.co_robic = 0;
			var cel = fejkownik.dane.cele[indeks].id;
			fejkownik.dane.cele[indeks].ilosc_atakow++;
			localStorage.setItem('fejkownik', JSON.stringify(fejkownik.dane)); 
			
			CommandPopup.openRallyPoint({target:cel});
			fejkownik.poczekaj_i_odpal();
		
			// location.href=(game_data.player.sitter != 0?("/game.php?t=" + game_data.player.id):"/game.php?")+"&village="+fejkownik.dane.wlasne[fejkownik.min_indeks].id+"&screen=place&"+cel+"&from=simulator"+wojsko;
		}
	},
	ilosc_wystapen: function(tab,wzor){
		var wynik = 0;
		for(w=0;w<tab.length;w++)
			if(tab[w] == wzor)
				wynik++;
		return wynik;
	},
	poczekaj_i_odpal: function(){
		if($(".autoHideBox").hasClass( "error" )){
			Dialog.close();
			setTimeout(function(){
				$(".autoHideBox").remove();
				fejkownik.atakuj_wioske();
			},fejkownik.dane.odswiezanie);
		}
		else if(fejkownik.co_robic==0 && $("#target_attack").length){
			$('#command-data-form').find("input[name='source_village']").val(fejkownik.dane.wlasne[fejkownik.min_indeks].id);
			if(fejkownik.dane.wlasne[fejkownik.min_indeks].wojska[9]=="0"){
				fejkownik.dane.wlasne[fejkownik.min_indeks].wojska[8]--;
				$("#unit_input_ram").val(1);
			}
			else{
				$("#unit_input_catapult").val(1);
				fejkownik.dane.wlasne[fejkownik.min_indeks].wojska[9]--;
			}
			if(fejkownik.dane.wlasne[fejkownik.min_indeks].wojska[4]!="0"){
				$("#unit_input_spy").val(1);
				fejkownik.dane.wlasne[fejkownik.min_indeks].wojska[4]--;
			}
			fejkownik.co_robic = 1;
			$("#target_attack").click();
			fejkownik.poczekaj_i_odpal();
		}
		else if(fejkownik.co_robic==1 && $("#troop_confirm_go").length){
			fejkownik.co_robic = 2;
			$("#troop_confirm_go").click();
			fejkownik.poczekaj_i_odpal();
			
		}
		else if(fejkownik.co_robic==2 && !$("#command-data-form").length){
			document.getElementsByClassName("autoHideBox")[0].innerHTML += fejkownik.dane.ostatnio_atakowana +"/"+ fejkownik.dane.maks_atakow*fejkownik.dane.cele.length;
			
			fejkownik.atakuj_wioske();
		}
		else
			setTimeout(fejkownik.poczekaj_i_odpal,fejkownik.dane.odswiezanie);
	},
	dzialaj: function(){
		fejkownik.atakuj_wioske();		
	},
	wypisz_cele: function(){
		var cele = "";
		for(i=0;i<fejkownik.dane.cele.length;i++){
			cele += fejkownik.dane.cele[i].x+"|"+fejkownik.dane.cele[i].y+" ";
		}
		return cele;
	},
	pobierz_dane_wiosek: function(){
		UI.InfoMessage('Poczekaj kilka sekund...', 1000, 'success');
		cele = document.getElementById('wpisane_wioski').value.match(/\d+\|\d+/g);
		fejkownik.dane.cele = [];
		fejkownik.dane.wlasne = [];
		fejkownik.dane.ostatnio_atakowana = 0;
		var r = new XMLHttpRequest();
		r.open('GET', "/map/village.txt", true);
		r.onreadystatechange = function(){
			if (r.readyState == 4 && r.status == 200){
				wiersze = r.responseText.split("\n");
				for(i=0;i<wiersze.length;i++){
					kolumna = wiersze[i].split(",");
					for(j=0;j<cele.length;j++){
						if((kolumna[2] + "|" + kolumna[3]) === cele[j]){
							fejkownik.dane.cele.push({
								x: kolumna[2],
								y: kolumna[3],
								id: kolumna[0],
								wlasciciel: kolumna[4],
								ilosc_atakow: 0
							});
							cele.splice(j,1);
							break;
						}
					}
				}
				fejkownik.pobierz_wlasne_wioski();
				localStorage.setItem('fejkownik', JSON.stringify(fejkownik.dane));
				document.getElementById('maks_rozkazow').innerHTML = fejkownik.dane.maks_atakow*fejkownik.dane.cele.length;
				document.getElementById('numer_kolejnego_rozkazu').value = 0;
				UI.InfoMessage('DodaĹem :) teraz kliknij "Nakurwiaj fejki"', 2000, 'success');
			}
		}
		r.send(null);
	},
	konkretny_dzien: function(){
		var d = $('#serverDate').html().match(/\d+/g);
		fejkownik.dane.konkretny_dzien = d[0];
		document.getElementById("konkretny_dzien").innerHTML = "<input size='3' type='text' value='"+d[0]+"' onchange=\"fejkownik.dane.konkretny_dzien = this.value;\">";
		document.getElementById("napis_konkretny_dzien").innerHTML = "Podaj dzieĹ miesiÄca";
	}
}
if(localStorage.fejkownik)
	fejkownik.dane = JSON.parse(localStorage.getItem('fejkownik'));
fejkownik.pobierz_wlasne_wioski();
fejkownik.dane.konkretny_dzien = 0;
okienko = "<h2>Fejkowanie</h2><table><tr><td align='center'><h4>Cele</h4><textarea cols=20 rows=10 id='wpisane_wioski'>"+(fejkownik.dane.cele.length?fejkownik.wypisz_cele():"Wklej wioski, kliknij zapisz i poczekaj kilka sekund :)")+"</textarea><br><input type='button' value='Zapisz' onclick='fejkownik.pobierz_dane_wiosek();' class='btn btn-confirm-yes'></td>";
okienko += "<td align='center' valign='top'><h4>Ustawienia</h4><table><tr><th>Co ile ms wykonywaÄ akcjÄ: <th><input size='3' type='text' value='"+fejkownik.dane.odswiezanie+"' onchange=\"fejkownik.dane.odswiezanie = parseInt(this.value);\">";
okienko += "<tr><th>Maks atakĂłw na wioskÄ: <th><input size='3' type='text' value='"+fejkownik.dane.maks_atakow+"' onchange=\"fejkownik.dane.maks_atakow = parseInt(this.value); document.getElementById('maks_rozkazow').innerHTML = fejkownik.dane.maks_atakow*fejkownik.dane.cele.length;\">";
okienko += "<tr><th>Maks atakĂłw z 1 wioski na gracza: <th><input size='3' type='text' value='"+fejkownik.dane.atk_na_gracza+"' onchange=\"fejkownik.dane.atk_na_gracza = parseInt(this.value);\">";
okienko += "<tr><th id='napis_konkretny_dzien'>WysyĹaÄ w konkretny dzieĹ ? <th id='konkretny_dzien'><input type='checkbox' onclick='fejkownik.konkretny_dzien();'>";
okienko += "<tr><th colspan='2'>Godziny wejĹcia atakĂłw od <input size='3' type='text' value='"+fejkownik.dane.min_godz+"' onchange='fejkownik.dane.min_godz = parseInt(this.value);'> do <input size='3' value='"+fejkownik.dane.max_godz+"' type='text' onchange='fejkownik.dane.max_godz = parseInt(this.value);'>";
okienko += "<tr><th colspan='2'>Numer rozkazu: <input size='3' id='numer_kolejnego_rozkazu' type='text' value='"+fejkownik.dane.ostatnio_atakowana+"' onchange=\"fejkownik.dane.ostatnio_atakowana = parseInt(this.value);\">/<b id='maks_rozkazow'>"+fejkownik.dane.maks_atakow*fejkownik.dane.cele.length+"</b>";

okienko += "</table><br><br><input type='button' class='btn' value='Nakurwiaj fejki' onclick=\"fejkownik.dzialaj();\"></table>";

Dialog.show("okienko",okienko);

//$("#linkContainer").prepend("<a href='#' onclick=\"fejkownik.wczytaj_cele();\">Cele</a> - <a href='#' onclick=\"fejkownik.dzialaj();\">nakurwiaj fejki</a> -");
