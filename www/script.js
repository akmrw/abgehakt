const config = require("./config.json");
let lists = [];

document.addEventListener("DOMContentLoaded", () => {

    const listLoader = document.getElementById("listLoader");
    const entryContainer = document.getElementById("entryContainer");

    listLoader.innerHTML = `<p id="listHeader">Deine Listen</p><div id="listContainer"></div>`;
    const listContainer = document.getElementById("listContainer");

    fetch(config.BASE_URL + config.BIN_ID, {
        headers: {
          "X-Master-Key": config.API_KEY
        }
    })
    .then(res => res.json())
    .then(data => {

        lists = data.record; // jsonbin packt deine Daten unter `record`
        console.log("Geladene Listen:", lists);

        // Alle Listen anzeigen
        lists.forEach(list => {
            const button = document.createElement("button");
            button.textContent = list.name;
            button.id = `list_${list.id}`;
            button.addEventListener("click", () => {
                showListEntries(list);
            });
            listContainer.appendChild(button);
        });

    });

    // Funktion zum Anzeigen der Einträge einer Liste
    function showListEntries(list) {

        entryContainer.innerHTML = `<h2>${list.name}</h2><ul></ul>`;
        const ul = entryContainer.querySelector("ul");
      
        list.entries.forEach(entry => {
            const li = document.createElement("li");
        
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `entry_${entry.id}`;
            checkbox.checked = !entry.active;
        
            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.textContent = entry.name;
        
            li.appendChild(checkbox);
            li.appendChild(label);
            ul.appendChild(li);

            checkbox.addEventListener("change", () => {
                li.classList.toggle("checked", checkbox.checked);

                // ✅ Finde die Liste und den Eintrag im globalen Array
                const currentList = lists.find(l => l.id === list.id);
                const currentEntry = currentList.entries.find(e => e.id === entry.id);

                // ✅ aktualisiere den Status
                currentEntry.active = !checkbox.checked;

                // ✅ schreibe gesamte Liste zurück
                writeFile(lists);
            });

        });
    }

    function writeFile(contentJSON) {
        fetch(config.BASE_URL + config.BIN_ID, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": config.API_KEY,
                "X-Bin-Versioning": false
            },
            body: JSON.stringify(contentJSON)
        })
        .then(res => res.json())
        .then(data => {
            console.log("Speichern erfolgreich:", data);
        })
        .catch(err => {
            console.error("Fehler beim Speichern:", err);
        });
    }
      
});