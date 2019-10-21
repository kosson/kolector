/* ======== Integrarea lui EditorJS ======== https://editorjs.io */
const editorX = new EditorJS({
    placeholder: 'Introdu conținutul nou sau copiază-l pe cel pe care îl ai într-un material.',
    /**
    * onReady callback
    */
    onReady: () => {
        console.log('Editor.js is ready to work!');
    },
    /**
     * Id of Element that should contain Editor instance
     */
    holder: 'codex-editor',
    /**
     * Enable autofocus
     */ 
    autofocus: true
});