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
   ✅ BUSCAR POKEMON
   - trim()
   - res.ok
   - try/catch
============================ */

async function buscar(){
  let q = document.getElementById("q").value.toLowerCase().trim()
  let modo = document.getElementById("modo").value

  if(!q) return

  try {

    if(modo === "pokemon"){

      // ✅ Buscar en cache primero
      let cache = getCache(q)
      if(cache){
        pintarPokemon(cache, "cache")
        cargarEvoluciones(cache.id)
        return
      }

      // ✅ Buscar en API con validación HTTP
      let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`)

      if(!res.ok){
        alert("❌ Pokémon no encontrado")
        return
      }

      let data = await res.json()

      // ✅ Guardar cache
      setCache(q, data)

      pintarPokemon(data, "api")

      // ✅ Evoluciones protegidas con try/catch
      try {
        cargarEvoluciones(data.id)
      } catch (e){
        console.warn("Error cargando evoluciones", e)
      }

      reproducirGrito(data.cries?.latest)

    }

  } catch (e){
    alert("⚠️ Error temporal con la API. Espera unos segundos y vuelve a intentar.")
    console.error("Error real:", e)
  }
}

/* ============================
   ✅ GRITO
============================ */

function reproducirGrito(url){
  if(url){
    audio.src = url
    audio.play()
  }
}

/* ============================
   ✅ PINTAR TARJETA
   - Fallback de imágenes incluido
============================ */

function pintarPokemon(p, origen){

  let imagen =
    p.sprites.front_default ||
    p.sprites.other?.['official-artwork']?.front_default ||
    p.sprites.other?.home?.front_default ||
    ""

  let habilidades = p.abilities.map(a=>`
    <span class="${a.is_hidden ? "habilidad-oculta" : ""}">
      ${a.ability.name}${a.is_hidden ? " (Oculta)" : ""}
    </span>
  `).join("")

  let tipos = p.types.map(t=>`<div>${t.type.name}</div>`).join("")

  let stats = p.stats.map(s=>`
    <div class="stat">
      <div>${s.stat.name}</div>
      <div class="barra">
        <div class="relleno" style="width:${Math.min(s.base_stat, 100)}%"></div>
      </div>
    </div>
  `).join("")

  app.innerHTML = `
    <div class="card">
      <div class="badge-data">POKEMON_DATA</div>
      <div class="badge-origen">${origen.toUpperCase()}</div>

      <div class="sprite-box">
        <img src="${imagen}">
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

/* ============================
   ✅ EVOLUCIONES INTELIGENTES
   - Lineales en 1 fila
   - Ramificadas en grid
============================ */

async function cargarEvoluciones(id){

  try {

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

    let baseImg =
      baseData.sprites.front_default ||
      baseData.sprites.other?.['official-artwork']?.front_default ||
      baseData.sprites.other?.home?.front_default ||
      ""

    let rootHTML = ""
    let evoHTML = ""

    // ✅ CASO LINEAL
    if(ramas.length === 0){

      rootHTML += `
        <div class="evo-root-box" onclick="buscarDirecto('${base}')">
          <img src="${baseImg}">
          <div>${base}</div>
        </div>
      `

      for(let n of lineal){
        let p = await fetch(`https://pokeapi.co/api/v2/pokemon/${n}`).then(r=>r.json())

        let evoImg =
          p.sprites.front_default ||
          p.sprites.other?.['official-artwork']?.front_default ||
          p.sprites.other?.home?.front_default ||
          ""

        rootHTML += `
          <div class="flecha">➜</div>
          <div class="evo" onclick="buscarDirecto('${n}')">
            <img src="${evoImg}">
            <div>${n}</div>
          </div>
        `
      }

      document.getElementById("evo-root").innerHTML = rootHTML
      document.getElementById("evos").innerHTML = ""
    }

    // ✅ CASO RAMIFICADO
    else {

      document.getElementById("evo-root").innerHTML = `
        <div class="evo-root-box" onclick="buscarDirecto('${base}')">
          <img src="${baseImg}">
          <div>${base}</div>
        </div>
        <div class="flecha">➜</div>
      `

      for(let n of ramas){
        let p = await fetch(`https://pokeapi.co/api/v2/pokemon/${n}`).then(r=>r.json())

        let evoImg =
          p.sprites.front_default ||
          p.sprites.other?.['official-artwork']?.front_default ||
          p.sprites.other?.home?.front_default ||
          ""

        evoHTML += `
          <div class="evo" onclick="buscarDirecto('${n}')">
            <img src="${evoImg}">
            <div>${n}</div>
          </div>
        `
      }

      document.getElementById("evos").innerHTML = evoHTML
    }

  } catch (e){
    console.warn("Error total cargando evoluciones:", e)
  }
}

/* ============================
   ✅ CLICK EN EVOLUCIÓN
============================ */

function buscarDirecto(n){
  document.getElementById("q").value = n
  buscar()
}
