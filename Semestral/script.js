let app = document.getElementById("app")
let audio = document.getElementById("sonido")
let cacheTiempo = 180000

document.getElementById("b").onclick = buscar
document.getElementById("tema").onclick = () => {
  document.body.classList.toggle("dark")
}

function getCache(k){
  let d = localStorage.getItem(k)
  if(!d) return null
  d = JSON.parse(d)
  if(Date.now() - d.t > cacheTiempo) return null
  return d.data
}

function setCache(k, data){
  localStorage.setItem(k, JSON.stringify({t:Date.now(), data}))
}

async function buscar(){
  let q = document.getElementById("q").value.toLowerCase()
  let modo = document.getElementById("modo").value
  if(!q) return

  if(modo==="pokemon"){
    let c = getCache(q)
    if(c){
      pintarPokemon(c, "cache")
      cargarEvoluciones(c.id)
      return
    }

    let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`)
    let data = await res.json()
    setCache(q, data)
    pintarPokemon(data, "api")
    cargarEvoluciones(data.id)
    reproducirGrito(data.cries.latest)
  }
}

function reproducirGrito(url){
  if(url){
    audio.src = url
    audio.play()
  }
}

function pintarPokemon(p, origen){
  let habilidades = p.abilities.map(a=>`
    <span class="${a.is_hidden?"habilidad-oculta":""}">
      ${a.ability.name}${a.is_hidden?" (Oculta)":""}
    </span>
  `).join("")

  let tipos = p.types.map(t=>`<div>${t.type.name}</div>`).join("")

  let stats = p.stats.map(s=>`
    <div class="stat">
      <div>${s.stat.name}</div>
      <div class="barra">
        <div class="relleno" style="width:${s.base_stat}%"></div>
      </div>
    </div>
  `).join("")

  app.innerHTML = `
    <div class="card">
      <div class="badge-data">POKEMON_DATA</div>
      <div class="badge-origen">${origen.toUpperCase()}</div>

      <div class="sprite-box">
        <img src="${p.sprites.front_default}">
      </div>

      <div class="titulo">#${p.id} ${p.name.toUpperCase()}</div>
      <div class="linea"></div>

      <div class="tipos">${tipos}</div>
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
    } else if(nodo.evolves_to.length === 1) {
      let sig = nodo.evolves_to[0]
      lineal.push(sig.species.name)
      recorrer(sig)
    }
  }

  recorrer(e.chain)

  let baseData = await fetch(`https://pokeapi.co/api/v2/pokemon/${base}`).then(r=>r.json())

  let rootHTML = ""
  let evoHTML = ""

  /* ✅ CASO 1: EVOLUCIÓN LINEAL (UNA SOLA FILA) */
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

  /* ✅ CASO 2: MÚLTIPLES EVOLUCIONES (EEVEE) */
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


function buscarDirecto(n){
  document.getElementById("q").value = n
  buscar()
}
