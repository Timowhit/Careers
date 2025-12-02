document.addEventListener('DOMContentLoaded', () => {
  // Footer: populate current year and last modified
  const cyEl = document.getElementById('currentyear');
  if(cyEl) cyEl.textContent = new Date().getFullYear();
  const lmEl = document.getElementById('lastmodified');
  if(lmEl) lmEl.textContent = document.lastModified;

  const Stations = ["EO-1","VB-1","LF-1","CA-1"];
  const StationDisplayNames = {"EO-1":"EOL","VB-1":"VBU","LF-1":"LFT","CA-1":"CAL"};
  const spaceOrder = ["WAC01-A1-9","WAC01-A1-8","WAC01-A1-7","WAC01-A1-6","WAC01-A1-5",
                      "WAC01-A1-4","WAC01-A1-3","WAC01-A1-2","WAC01-A1-1","WAC01-A1-0"];

  // Update header datetime every second
  const datetimeEl = document.getElementById('datetime');
  function updateDateTime(){
    const now = new Date();
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const mon = months[now.getMonth()];
    const dd = String(now.getDate()).padStart(2,'0');
    const yyyy = now.getFullYear();
    datetimeEl.textContent = `${hh}:${mm} ${mon} ${dd},${yyyy}`;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  const logEl = document.getElementById('log');
  // full in-memory log (all events except periodic ticks). We render only latest 5 entries.
  const fullLog = [];
  // clear placeholder
  logEl.innerHTML = '';

  function getNextCarNumber(){
    const key = 'nextCarNumber';
    let n = parseInt(localStorage.getItem(key) || '14019', 10);
    localStorage.setItem(key, String(n+1));
    return n;
  }

  function formatLogEntry(entry){
    return `<span class=\"log-time\">${entry.time}</span> ${entry.msg}`;
  }

  function renderLatest(){
    logEl.innerHTML = '';
    const slice = fullLog.slice(-5);
    for(let i = slice.length-1; i>=0; i--){
      const e = slice[i];
      const li = document.createElement('li');
      li.innerHTML = formatLogEntry(e);
      logEl.appendChild(li);
    }
  }

  function pushLog(msg){
    const time = new Date().toLocaleTimeString();
    fullLog.push({time, msg});
    renderLatest();
  }

  function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}

  // Persist states in localStorage so refresh behaves similarly to Session in ASP.NET
  function loadStates(){
    try{const raw=localStorage.getItem('carStates');return raw?JSON.parse(raw):{}}catch(e){return{}}}
  function saveStates(s){localStorage.setItem('carStates',JSON.stringify(s));}

  let carStates = loadStates();

  function getLastUpdate(){const v=localStorage.getItem('lastUpdate');return v?new Date(v):new Date(0)}
  function setLastUpdate(d){localStorage.setItem('lastUpdate',d.toISOString())}

  function initializeCarStates(){
    carStates = {};
    spaceOrder.forEach(spaceId=>{
      const scenario = rand(0,99);
      if(scenario < 35){ carStates[spaceId] = { HasCar:false } }
      else if(scenario < 55){ // completed
        const completion = new Date(Date.now()-rand(0,4)*3600000 - rand(0,59)*60000).toISOString();
        // set a station start time before completion so elapsed can be calculated
        const start = new Date(Date.parse(completion) - (rand(30,600)*1000)).toISOString();
        const carId = `CAR${getNextCarNumber()}`;
        carStates[spaceId] = { HasCar:true, IsCompleted:true, CompletionTime: completion, StationStartTime: start, CarId: carId };
      } else {
        const si = rand(0, Stations.length-1);
        const progress = rand(15,85);
        // estimate a station start time in the past based on progress
        const estimatedMs = progress * 1000 * 2; // approx: 2s per percent
        const carId = `CAR${getNextCarNumber()}`;
        carStates[spaceId] = { HasCar:true, IsCompleted:false, CurrentStation:Stations[si], StationIndex:si, Progress:progress, StationStartTime: new Date(Date.now() - estimatedMs).toISOString(), CarId: carId }
      }
    });
    setLastUpdate(new Date());
    saveStates(carStates);
    // initial log entries that mirror original ASPX status lines, using CAR IDs when available
    Object.keys(carStates).forEach(spaceId => {
      const s = carStates[spaceId];
      if(!s.HasCar) pushLog(`${spaceId} - No Car`);
      else if(s.IsCompleted) pushLog(`${s.CarId || 'CAR?'} - Completed (space ${spaceId})`);
      else pushLog(`${s.CarId || 'CAR?'} - In progress (space ${spaceId})`);
    });
  }

  function updateCarStates(){
    // keep a snapshot to detect transitions for logging
    const prev = JSON.parse(JSON.stringify(carStates));
    Object.keys(carStates).forEach(k=>{
      const car = carStates[k];
      if(!car.HasCar || car.IsCompleted){
        if(!car.HasCar && rand(0,99) < 10){
          car.HasCar=true; car.IsCompleted=false; car.CurrentStation=Stations[0]; car.StationIndex=0; car.Progress=rand(5,15); car.StationStartTime = new Date().toISOString();
          if(!car.CarId) car.CarId = `CAR${getNextCarNumber()}`;
          pushLog(`${car.CarId} - arrived at ${k}`);
        }
        if(car.IsCompleted && rand(0,99) < 5){
          // completed car removed
          pushLog(`${car.CarId || k} - removed after completion`);
          car.HasCar=false; car.IsCompleted=false; car.CompletionTime=null; car.StationStartTime = null; car.CarId = null;
        }
      } else {
        const oldStationIndex = car.StationIndex;
        const oldProgress = car.Progress;
        car.Progress = Math.min(100, car.Progress + rand(3,9));
        if(car.Progress >= 100){
          if(car.StationIndex < Stations.length-1){
            car.StationIndex++; car.CurrentStation = Stations[car.StationIndex]; car.Progress = rand(5,15); car.StationStartTime = new Date().toISOString();
            pushLog(`${car.CarId || k} - moved to ${car.CurrentStation}`);
          } else {
            car.IsCompleted = true; car.CompletionTime = new Date().toISOString(); car.CurrentStation = null; car.Progress = 0;
            // keep StationStartTime so elapsed can be calculated (paused)
            pushLog(`${car.CarId || k} - Completed (elapsed ${formatElapsed(new Date(car.CompletionTime).getTime() - new Date(car.StationStartTime).getTime())})`);
          }
        } else if(car.Progress > oldProgress + 25){
          // occasional milestone log to mimic ASPX updates
          pushLog(`${car.CarId || k} - ${car.CurrentStation} ${car.Progress}%`);
        }
      }
      carStates[k] = car;
      // if previously empty and now has a completed state (edge-case), log it
      const p = prev[k];
      if(p && p.HasCar && !car.HasCar && p.IsCompleted && !car.IsCompleted){
        pushLog(`${p.CarId || k} - Cleared`);
      }
    });
    setLastUpdate(new Date());
    saveStates(carStates);
  }

  // Update the .space-divider elements every second to show elapsed time while in-progress
  function formatElapsed(ms){
    if(ms < 0) ms = 0;
    const total = Math.floor(ms/1000);
    const hrs = Math.floor(total/3600);
    const mins = Math.floor((total%3600)/60);
    const secs = total%60;
    if(hrs>0) return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function updateDividers(){
    document.querySelectorAll('.parking-space').forEach(el=>{
      const spaceId = el.getAttribute('data-spaceid');
      const state = carStates[spaceId] || { HasCar:false };
      const divider = el.querySelector('.space-divider');
      if(!divider) return;
      if(!state.HasCar){ divider.textContent = '--:--'; }
      else if(state.IsCompleted){
        // show paused elapsed time when completed
        if(state.StationStartTime && state.CompletionTime){
          const elapsed = new Date(state.CompletionTime).getTime() - new Date(state.StationStartTime).getTime();
          divider.textContent = formatElapsed(elapsed);
        } else {
          const ct = state.CompletionTime? new Date(state.CompletionTime) : new Date();
          divider.textContent = ct.toLocaleTimeString();
        }
      } else {
        const start = state.StationStartTime? new Date(state.StationStartTime) : null;
        if(start){ divider.textContent = formatElapsed(Date.now() - start.getTime()); }
        else { divider.textContent = '--:--'; }
      }
    });
  }

  function buildStationInfo(activeStation, spaceId){
    let html = '';
    Stations.forEach(s=>{
      if(s === activeStation) html += `<span class='station-label station-active'>${s}</span>&nbsp;&nbsp;&nbsp;&nbsp;`;
      else html += `<span class='station-label'>${s}</span>&nbsp;&nbsp;&nbsp;&nbsp;`;
    });
    return `${html}<br/>${spaceId}:`;
  }

  function updateParkingSpace(element){
    const spaceId = element.getAttribute('data-spaceid');
    const state = carStates[spaceId] || { HasCar:false };
    const contentDiv = element.querySelector('.space-content');
    const infoDiv = element.querySelector('.space-info');
    const btn = element.querySelector('.status-button');

    if(!state.HasCar){
      btn.className = 'status-button empty'; btn.textContent = 'No Car';
      contentDiv.innerHTML = '';
      infoDiv.innerHTML = buildStationInfo(null, spaceId);
    } else if(state.IsCompleted){
      btn.className = 'status-button ready'; btn.textContent = 'Ready for GA';
      const carTag = state.CarId || 'CAR?';
      const elapsed = (state.StationStartTime && state.CompletionTime) ? (new Date(state.CompletionTime).getTime() - new Date(state.StationStartTime).getTime()) : 0;
      contentDiv.innerHTML = `<div class='car-display' style='text-align:center;'><div style='font-size:18px;font-weight:700;margin-bottom:8px'>${carTag}</div><div class='completion-time'>Completed: ${formatElapsed(elapsed)}</div></div>`;
      infoDiv.innerHTML = buildStationInfo(null, spaceId);
    } else {
      btn.className = 'status-button not-ready'; btn.textContent = 'Not Ready';
      const carTag = state.CarId || 'CAR?';
      contentDiv.innerHTML = `<div class='car-display' style='text-align:center;'><div style='font-size:18px;font-weight:700;margin-bottom:8px'>${carTag}</div><div class='progress-container'><div class='progress-bar' style='width:${state.Progress}%;'>${state.Progress}%</div></div></div>`;
      infoDiv.innerHTML = buildStationInfo(state.CurrentStation, spaceId);
    }
  }

  function renderAll(){
    document.querySelectorAll('.parking-space').forEach(el=>updateParkingSpace(el));
  }

  // initialize or update based on lastUpdate (reset after 5 minutes)
  const last = getLastUpdate();
  if(last.getTime() === 0 || (Date.now() - last.getTime()) > 5*60*1000){ initializeCarStates(); pushLog('Initialized simulated states'); }
  else { updateCarStates(); pushLog('Resumed previous simulated states') }
  renderAll();
  // start divider updater (1s) and periodic tick every 3 seconds
  updateDividers();
  setInterval(updateDividers, 1000);
  setInterval(()=>{
    updateCarStates(); renderAll();
  }, 3000);
 });
