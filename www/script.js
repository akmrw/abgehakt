const config = require("./config.json");

let lists = []; // Liste von Listen global verfügbar machen
let activeListId = null; // speichert die aktive Listen-ID

document.addEventListener("DOMContentLoaded", () => {
    const listLoader = document.getElementById("listLoader");
    const entryContainer = document.getElementById("entryContainer");

    listLoader.innerHTML = `
    <div id="listHeader">
        <h2>Deine Listen</h2>
        <button id="addListButton">+</button>
    </div>
    <div id="listContainer">
        <!-- Dynamisch erzeugte Buttons für jede Liste -->
    </div>
    `;

    document.getElementById("addListButton").addEventListener("click", () => {
        const name = prompt("Wie soll die neue Liste heißen?");
        if (name && name.trim()) {
            const newList = {
                id: Date.now(),
                name: name.trim(),
                entries: []
            };
            lists.push(newList);
            writeFile(lists);
            activeListId = newList.id;
            renderListButtons(); // aktualisiert die Listenansicht
            showListEntries(newList, true);
        }
    });    

    const listContainer = document.getElementById("listContainer");

    fetch(config.BIN_URL, {
        headers: {
            "X-Master-Key": config.API_KEY
        }
    })
    .then(res => res.json())
    .then(data => {
        lists = data.record;
        renderListButtons();
    });

    function renderListButtons() {
        listContainer.innerHTML = ""; // Vorherige Buttons löschen
    
        lists.forEach(list => {
            const button = document.createElement("button");
            button.textContent = list.name;
            button.id = `list_${list.id}`;
    
            // Wenn diese Liste aktiv ist, gib ihr die .active-Klasse
            if (list.id === activeListId) {
                button.classList.add("active");
            }
    
            button.addEventListener("click", () => {
                activeListId = list.id; // aktiviere diese Liste
                showListEntries(list, false);
                renderListButtons(); // Buttons neu rendern → nur einer bekommt .active
            });
    
            listContainer.appendChild(button);
        });
    }    

    function showListEntries(list, focusDummy = false) {

        entryContainer.innerHTML = `<h2>${list.name}</h2><ul></ul>`;
        const ul = entryContainer.querySelector("ul");
    
        const activeEntries = list.entries.filter(e => e.active);
        const checkedEntries = list.entries.filter(e => !e.active);
    
        function createEntryElement(entry) {
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
            li.classList.toggle("checked", checkbox.checked);
        
            // ✅ Nur aktive Einträge verschiebbar machen
            if (entry.active) {
                li.draggable = true;
        
                li.addEventListener("dragstart", (e) => {
                    li.classList.add("dragging");
                    e.dataTransfer.setData("text/plain", entry.id);
                });
        
                li.addEventListener("dragend", () => {
                    li.classList.remove("dragging");
                });
            }
        
            checkbox.addEventListener("change", () => {
                const currentList = lists.find(l => l.id === list.id);
                const currentEntry = currentList.entries.find(e => e.id === entry.id);
                currentEntry.active = !checkbox.checked;
                writeFile(lists);
                showListEntries(currentList); // neu sortieren & anzeigen
            });
        
            li.addEventListener("click", (e) => {
                if (e.target === li) {
                    checkbox.click();
                }
            });
        
            return li;
        }        
    
        activeEntries.forEach(entry => {
            ul.appendChild(createEntryElement(entry));
        });

        ul.addEventListener("dragover", (e) => {
            e.preventDefault();
            const draggingEl = ul.querySelector(".dragging");
            const afterElement = getDragAfterElement(ul, e.clientY);
            if (afterElement == null) {
                // Füge vor dem Dummy-Divider ein → also vor dividerAboveDummy
                const dividerAboveDummy = ul.querySelector("hr:nth-last-of-type(2)");
                if (dividerAboveDummy) {
                    ul.insertBefore(draggingEl, dividerAboveDummy);
                } else {
                    ul.appendChild(draggingEl); // Fallback (sollte nie nötig sein)
                }
            } else {
                ul.insertBefore(draggingEl, afterElement);
            }            
        });
        
        ul.addEventListener("drop", () => {
            const currentList = lists.find(l => l.id === list.id);
            const newOrder = [];
        
            // Nur aktive <li> berücksichtigen
            const items = ul.querySelectorAll("li:not(.checked):not(.dummy-entry)");
            items.forEach(li => {
                const id = li.querySelector("input[type='checkbox']").id.replace("entry_", "");
                const entry = currentList.entries.find(e => e.id == id);
                if (entry) newOrder.push(entry);
            });
        
            const inactiveEntries = currentList.entries.filter(e => !e.active);
            currentList.entries = [...newOrder, ...inactiveEntries]; // Neue Sortierung übernehmen
        
            writeFile(lists);
        });        
    
        if (checkedEntries.length > 0) {
            const divider = document.createElement("hr");
            ul.appendChild(divider);
        }
    
        checkedEntries.forEach(entry => {
            ul.appendChild(createEntryElement(entry));
        });


        const dividerAboveDummy = document.createElement("hr");
        ul.appendChild(dividerAboveDummy);
    
        addDummyEntry(list, ul, focusDummy); // neuer Eintrag unten, Fokus optional

        const dividerBelowDummy = document.createElement("hr");
        ul.appendChild(dividerBelowDummy);
    
        const buttonRow = document.createElement("div");
        buttonRow.className = "button-row";
    
        const clearCheckedButton = document.createElement("button");
        clearCheckedButton.textContent = "✔ Abgehakte löschen";
        clearCheckedButton.className = "clear-checked-button";
        clearCheckedButton.addEventListener("click", () => {
            if (confirm("Wirklich alle abgehakten Einträge löschen?")) {
                const currentList = lists.find(l => l.id === list.id);
                currentList.entries = currentList.entries.filter(e => e.active);
                writeFile(lists);
                showListEntries(currentList, false);
            }
        });
    
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Liste löschen 🗑";
        deleteButton.className = "delete-button";
        deleteButton.addEventListener("click", () => {
            if (confirm("Diese Liste wirklich löschen?")) {
                lists = lists.filter(l => l.id !== list.id);
                writeFile(lists);
                entryContainer.innerHTML = "";
                entryContainer.classList.add("hidden");
                activeListId = null;
                renderListButtons();
            }
        });
    
        buttonRow.appendChild(clearCheckedButton);
        buttonRow.appendChild(deleteButton);
        entryContainer.appendChild(buttonRow);
    
        entryContainer.classList.remove("hidden");
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll("li:not(.checked):not(.dummy-entry):not(.dragging)")];
    
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
    
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function addDummyEntry(currentList, ul, focusDummy = false) {
        const li = document.createElement("li");
        li.classList.add("dummy-entry");
    
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Neuen Eintrag hinzufügen...";
        input.classList.add("dummy-input");
    
        const saveButton = document.createElement("button");
        saveButton.textContent = "💾";
        saveButton.classList.add("save-entry-button");
    
        input.addEventListener("input", () => {
            saveButton.style.display = input.value.trim() ? "inline-block" : "none";
        });
    
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                saveButton.click();
            }
        });
    
        saveButton.addEventListener("click", () => {
            const entryText = input.value.trim();
            if (!entryText) return;
    
            const newEntry = {
                id: generateId(),
                name: entryText,
                active: true
            };
    
            const current = lists.find(l => l.id === currentList.id);
            current.entries.push(newEntry);
            writeFile(lists);
            showListEntries(current, true); // Fokus wieder aktivieren
        });
    
        li.appendChild(input);
        li.appendChild(saveButton);
        ul.appendChild(li);
    
        if (focusDummy) {
            setTimeout(() => input.focus(), 100);
        }
    }                      

    function writeFile(contentJSON) {
        fetch(config.BIN_URL, {
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

    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

});