document.addEventListener("DOMContentLoaded", () => {

    const listLoader = document.getElementById("listLoader");
    const entryContainer = document.getElementById("entryContainer");

    listLoader.innerHTML = `<p id="listHeader">Deine Listen</p><div id="listContainer"></div>`;
    const listContainer = document.getElementById("listContainer");

    // JSON laden
    fetch('./abgehakt.json')
    .then(response => response.json())
    .then(lists => {
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
    })
    .catch(error => {
        console.error("Fehler beim Laden der Listen:", error);
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
          });

        });
    }
      
});