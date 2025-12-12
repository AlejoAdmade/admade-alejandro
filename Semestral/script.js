let app = document.getElementById("app")
let audio = document.getElementById("sonido")

// Cache de 3 minutos
let cacheTiempo = 180000

document.getElementById("b").onclick = buscar
document.getElementById("tema").onclick = () => {
  document.body.classList.toggle("dark")
}

/* ============================
   CACHE LOCAL
============================ */

function getCache(k){
  let d = localStorage.getItem(k)
  if(!d) return null
  d = JSON.parse(d)
  if(Date.now() - d.t > cacheTiempo) return null
  return d.data
}

function setCache(k, data){
  localStorage.setItem(k, JSON.stringify({ t: Date.now(), data }))
}

/* ============================
   BUSQUEDA PRINCIPAL
============================ */

async function buscar(){
  let q = document.getElementById("q").value.toLowerCase().trim()
  let modo = document.getElementById("modo").value

  if(!q) return

  if(modo === "pokemon"){
    buscarPokemon(q)
    return
  }

  if(modo === "habilidad"){
    buscarHabilidad(q)
    return
  }
}

/* ============================
   BUSCAR POKÉMON
============================ */

async function buscarPokemon(q){
  try {
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

    try {
      cargarEvoluciones(data.id)
    } catch {}

    reproducirGrito(data.cries?.latest)

  } catch (e){
    alert("⚠️ Error con la API")
    console.error(e)
  }
}

/* ============================
   SONIDO
============================ */

function reproducirGrito(url){
  if(!url) return
  audio.pause()
  audio.currentTime = 0

  setTimeout(()=>{
    audio.src = url + "?v=" + Math.random()
    audio.play()
  }, 50)
}

/* ============================
   TARJETA POKÉMON
============================ */

function pintarPokemon(p, origen){
  let habilidades = p.abilities.map(a=>`
    <span class="${a.is_hidden ? "habilidad-oculta" : ""}">
      ${a.ability.name}${a.is_hidden ? " (Oculta)" : ""}
    </span>
  `).join("")

  let tipos = p.types.map(t=>`<div>${t.type.name}</div>`).join("")

  let stats = p.stats.map(s=>{
    let porcentaje = Math.min((s.base_stat / 255) * 100, 100)
    return `
      <div class="stat">
        <div>${s.stat.name}</div>
        <div class="barra">
          <div class="relleno" style="width:${porcentaje}%"></div>
        </div>
      </div>
    `
  }).join("")

  let img =
    p.sprites.front_default ||
    p.sprites.other?.["official-artwork"]?.front_default ||
    ""

  app.innerHTML = `
    <div class="card">
      <div class="badge-data">POKEMON_DATA</div>
      <div class="badge-origen">${origen.toUpperCase()}</div>

      <div class="sprite-box">
        <img src="${img}">
      </div>

      <div class="titulo">#${p.id} ${p.name.toUpperCase()}</div>
      <div class="linea"></div>

      <div class="tipos">${tipos}</div>
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
  CLICK DIRECTO
============================ */

function buscarDirecto(nombre){
  document.getElementById("q").value = nombre
  document.getElementById("modo").value = "pokemon"
  buscar()
}

/* ============================
   CLICK DESDE HABILIDAD
============================ */

function buscarPokemonDesdeHabilidad(nombre){
  document.getElementById("modo").value = "pokemon"  // cambia la pestaña
  document.getElementById("q").value = nombre        // pone el nombre
  buscar()                                           // ejecuta búsqueda
}

/* ============================
   BUSCAR HABILIDAD
============================ */

async function buscarHabilidad(q){
  try {
    let res = await fetch(`https://pokeapi.co/api/v2/ability/${q}`)
    if(!res.ok){
      alert("❌ Habilidad no encontrada")
      return
    }

    let ability = await res.json()

    let effectText =
      ability.effect_entries.find(e=>e.language.name==="en")?.effect
      || "No description available."

    let lista = ""

    for(let entry of ability.pokemon){
      let name = entry.pokemon.name
      let isHidden = entry.is_hidden

      let pokeRes = await fetch(entry.pokemon.url.replace("pokemon-species","pokemon"))
      let poke = await pokeRes.json()

      let img =
        poke.sprites.front_default ||
        poke.sprites.other?.["official-artwork"]?.front_default ||
        ""

      lista += `
        <div class="hab-item" onclick="buscarPokemonDesdeHabilidad('${name}')">
          <img src="${img}">
          <div class="hab-name">
            ${name.toUpperCase()} ${isHidden ? "<span class='hidden-tag'>(oculta)</span>" : ""}
          </div>
        </div>
      `
    }

    app.innerHTML = `
      <div class="card-ability">

        <div class="ability-header">
          <h1 class="ability-title">${ability.name.toUpperCase()}</h1>
          <div class="ability-id">#${ability.id}</div>
        </div>

        <div class="ability-section">
          <h3>Effect</h3>
          <div class="ability-effect-box">${effectText}</div>
        </div>

        <div class="ability-section">
          <h3>Pokémon with this ability (${ability.pokemon.length})</h3>

          <div class="ability-list-box">
            ${lista}
          </div>
        </div>

      </div>
    `

  } catch(e){
    alert("⚠️ Error con la API de habilidades")
    console.error(e)
  }
}

/* ============================
   EVOLUCIONES
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
