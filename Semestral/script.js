let app = document.getElementById("app")
let audio = document.getElementById("sonido")

// ✅ Cache de 3 minutos
let cacheTiempo = 180000

document.getElementById("b").onclick = buscar
document.getElementById("tema").onclick = () => {
  document.body.classList.toggle("dark")
}

/* ============================
   ✅ CACHE LOCAL
============================ */

function getCache(k){
  let d = localStorage.getItem(k)
  if(!d) return null
  d = JSON.parse(d)
  if(Date.now() - d.t > cacheTiempo) return null
  return d.data
}

function setCache(k, data){
  localStorage.setItem(k, JSON.stringify({
    t: Date.now(),
    data
  }))
}

/* ============================
   ✅ BUSCAR POKEMON / HABILIDAD
============================ */

async function buscar(){
  let q = document.getElementById("q").value.toLowerCase().trim()
  let modo = document.getElementById("modo").value

  if(!q) return

  try {

    /* ==========================
       🔍 MODO: BUSCAR POKÉMON
    ========================== */
    if(modo === "pokemon"){

      let cache = getCache(q)
      if(cache){
        pintarPokemon(cache, "cache")
        cargarEvoluciones(cache.id)
        reproducirGrito(cache.cries?.latest)
        return
      }

      let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`)

      if(!res.ok){
        alert("❌ Pokémon no encontrado")
        return
      }

      let data = await res.json()
      setCache(q, data)

      pintarPokemon(data, "api")
      cargarEvoluciones(data.id)
      reproducirGrito(data.cries?.latest)
    }


    /* ==========================
       🔍 MODO: BUSCAR HABILIDAD
    ========================== */
    else if(modo === "habilidad"){

      let res = await fetch(`https://pokeapi.co/api/v2/ability/${q}`)
      if(!res.ok){
        alert("❌ Habilidad no encontrada")
        return
      }

      let data = await res.json()
      pintarHabilidad(data)
    }

  } catch (e){
    alert("⚠️ Error temporal con la API. Intenta de nuevo.")
    console.error(e)
  }
}

/* ============================
   ✅ GRITO
============================ */

function reproducirGrito(url){
  if(url){
    audio.pause()
    audio.currentTime = 0
    audio.src = url
    audio.play().catch(()=>{})
  }
}

/* ============================
   ✅ TARJETA POKÉMON
============================ */

function pintarPokemon(p, origen){

  let habilidades = p.abilities.map(a=>`
    <span class="${a.is_hidden ? "habilidad-oculta" : ""}">
      ${a.ability.name}${a.is_hidden ? " (Oculta)" : ""}
    </span>
  `).join("")

  let tipos = p.types.map(t=>`<div>${t.type.name}</div>`).join("")

  let stats = p.stats.map(s=>{
    let pct = Math.min(s.base_stat, 100) // ← nunca supera 100
    return `
      <div class="stat">
        <div>${s.stat.name}</div>
        <div class="barra">
          <div class="relleno" style="width:${pct}%"></div>
        </div>
      </div>
    `
  }).join("")

  app.innerHTML = `
    <div class="card">
      <div class="badge-data">POKEMON_DATA</div>
      <div class="badge-origen">${origen.toUpperCase()}</div>

      <div class="sprite-box">
        <img src="${p.sprites.front_default || p.sprites.other?.['official-artwork']?.front_default}">
      </div>

      <div class="titulo">#${p.id} ${p.name.toUpperCase()}</div>
      <div class="linea"></div>

      <!-- ⭐ TIPOS A LA IZQUIERDA -->
      <div class="tipos">${tipos}</div>

      <!-- ⭐ NUEVO: TÍTULO HABILIDADES -->
      <h3 style="text-align:left; margin:10px 0 6px 0;">HABILIDADES</h3>
      <div class="habilidades">${habilidades}</div>

      ${stats}

      <div class="fav-btn"><button>❤️</button></div>

      <div class="separador"></div>
      <b>CADENA DE EVOLUCIÓN</b>

      <div class="evo-root" id="evo-root"></div>
      <div class="evos-grid" id="evos"></div>
    </div>
  `
}

/* ============================
   ✅ TARJETA DE HABILIDAD
============================ */

function pintarHabilidad(h){

  let list = h.pokemon.map(pk=>`
    <div class="hab-poke" onclick="buscarDirecto('${pk.pokemon.name}')">
      ${pk.pokemon.name}
    </div>
  `).join("")

  app.innerHTML = `
    <div class="card">
      <h2>${h.name.toUpperCase()}</h2>

      <div class="linea"></div>

      <h3 style="text-align:left;">EFFECT</h3>
      <p style="text-align:left;">
        ${h.effect_entries.find(e=>e.language.name==="en")?.effect || "No effect text"}
      </p>

      <h3 style="margin-top:12px;">Pokémon with this ability</h3>

      <div class="lista-habilidad" style="max-height:260px; overflow-y:auto;">
        ${list}
      </div>
    </div>
  `
}

/* ============================
   ✅ EVOLUCIONES
============================ */

async function cargarEvoluciones(id){
  let s = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(r=>r.json())
  let e = await fetch(s.evolution_chain.url).then(r=>r.json())

  let base = e.chain.species.name
  let ramas = []
  let lineal = []

  function recorrer(nodo){
    if(!nodo) return

    if(nodo.evolves_to.length > 1){
      for(let evo of nodo.evolves_to){
        ramas.push(evo.species.name)
      }
    }
    else if(nodo.evolves_to.length === 1){
      let sig = nodo.evolves_to[0]
      lineal.push(sig.species.name)
      recorrer(sig)
    }
  }

  recorrer(e.chain)

  let baseData = await fetch(`https://pokeapi.co/api/v2/pokemon/${base}`).then(r=>r.json())

  let rootHTML = ""
  let evoHTML = ""

  if(ramas.length === 0){

    rootHTML += `
      <div class="evo-root-box" onclick="buscarDirecto('${base}')">
        <img src="${baseData.sprites.front_default}">
        <div>${base}</div>
      </div>
    `

    for(let n of lineal){
      let p = await fetch(`https://pokeapi.co/api/v2/pokemon/${n}`).then(r=>r.json())

      rootHTML += `
        <div class="flecha">➜</div>
        <div class="evo" onclick="buscarDirecto('${n}')">
          <img src="${p.sprites.front_default}">
          <div>${n}</div>
        </div>
      `
    }

    document.getElementById("evo-root").innerHTML = rootHTML
    document.getElementById("evos").innerHTML = ""
  }

  else {

    document.getElementById("evo-root").innerHTML = `
      <div class="evo-root-box" onclick="buscarDirecto('${base}')">
        <img src="${baseData.sprites.front_default}">
        <div>${base}</div>
      </div>
      <div class="flecha">➜</div>
    `

    for(let n of ramas){
      let p = await fetch(`https://pokeapi.co/api/v2/pokemon/${n}`).then(r=>r.json())

      evoHTML += `
        <div class="evo" onclick="buscarDirecto('${n}')">
          <img src="${p.sprites.front_default}">
          <div>${n}</div>
        </div>
      `
    }

    document.getElementById("evos").innerHTML = evoHTML
  }
}

/* ============================
   ✅ CLICK EN EVOLUCIÓN / HABILIDAD
============================ */

function buscarDirecto(n){
  document.getElementById("q").value = n
  document.getElementById("modo").value = "pokemon"
  buscar()
}
