const storage    = (typeof browser === 'undefined') ? chrome.storage.local : browser.storage.local;
const browserObj = (typeof browser === 'undefined') ? chrome : browser;
const version = browserObj.runtime.getManifest().version;
document.getElementById('version').textContent = version;

const home = document.getElementById( "bys_home_button" )
const settings_list = document.getElementById( "settings_list" )
var settings

function createSettingItem( [ name, value ] )
{
  const formatName = name => name.replace( / /g, "_" ).toLowerCase()
  
  const li = document.createElement( "li" )

  const label = document.createElement( "label" )
  label.htmlFor = `${formatName( name )}_checkbox`
  label.innerText = `Enable ${name}?`
  
  const check   = document.createElement( "input" )
  check.type    = "checkbox"
  check.name    = `${formatName( name )}_checkbox`
  check.checked = value
  check.value   = value
  check.addEventListener( "change", e => {
    console.log( `DEBUG :: Clicked checkbox with name ${name}` )
    settings[ name ] = !settings[ name ]
  } )

  li.appendChild( label )
  li.appendChild( check )
  
  return li
}

function populateSettingsList( settings )
{
  Object.entries( settings ).map( ( setting ) => {
    settings_list.appendChild( createSettingItem( setting ) )
  } )
}

function handleSettingChange( o, prop, value )
{
  console.log( `[BYS] :: Turned setting ${prop} ${ value ? "on" : "off" }` )
  o[ prop ] = value

  storage.set( { settings: o } ) // todo  change all localstorage sets to be chrome storage
}

// settings from localStorage (fallback)
const settingsFromStorage = JSON.parse( localStorage.getItem("yt-settings") )
if ( settingsFromStorage !== null )
  settings = new Proxy( settingsFromStorage, {
    // I'm using a proxy so we can cleanly save any changes to storage
    set: handleSettingChange
  } )

function main()
{
  // Set user's prefers-color-scheme
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', "dark")
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    const newColorScheme = event.matches ? "dark" : "light"
    document.documentElement.setAttribute('data-theme', newColorScheme)
  })

  // settings from chrome storage
  storage.get( ["settings"] )
    .then( result => {
      if ( result.settings )
      {
        Object.entries( defaultSettings ).map( ([ setting, value ]) => {
          if ( result.settings[ setting ] === undefined )
            result.settings[ setting ] = value
        } )

        // compare the chrome storage to our backup
        if ( result.settings !== {...settings} )
        {
          localStorage.setItem("yt-settings", JSON.stringify( result.settings ));
        }
        
        settings = new Proxy( result.settings, {
          set: handleSettingChange
        } )
      }

      // initialise data for the first time
      if ( settings === undefined )
      {
        settings = {...defaultSettings}
        localStorage.setItem( "yt-settings", JSON.stringify( settings ) )
        storage.set( { settings } )
      }
      
      populateSettingsList( settings )
    })

  home.addEventListener( "click", e => {
    window.location.href = "/popup.html"
  } )

}

main()