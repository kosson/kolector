class UploaderPlus{
    /**
     * @param {Object} config
     * @param {Function} onUpload - callback for successful file upload
     * @param {Function} onError - callback for uploading errors
     */
    constructor({ config, onUpload, onError }) {
        this.config = config;
        this.onUpload = onUpload;
        this.onError = onError;
    }

    /**
     * Handle clicks on the upload file button
     * @fires ajax.transport()
     * @param {function} onPreview - callback fired when preview is ready
     */
    uploadSelectedFile({onPreview}) {
        ajax.transport({
            url:        this.config.endpoint || '',
            accept:     this.config.types    || '*',
            multiple:   this.config.multiple || true,
            data:       this.config.data     || {},
            headers:    this.config.headers  || {},
            fieldName:  this.config.field    || 'file',
            beforeSend: () => onPreview(),
            progress: function (percentage) {
                document.title = `${percentage}%`;
            },
            ratio: 95,
        }).then((response) => {            
            this.onUpload(response);
        }).catch((error) => {
            const message = (error && error.message) ? error.message : this.config.errorMessage || 'File upload failed';
            this.onError(message);
        });
    }
}

/* === EXTINDE Clasa AttachesTool === */
export class AttachesToolPlus extends AttachesTool {
    /**
     * @param {AttachesToolData} data
     * @param {Object} config
     * @param {API} api
     */
    constructor({ data, config, api }) {
        super({
            data:   data,
            config: config,
            api:    api
        });
        this.config.headers = config.headers || {}; 
        this.uploader = new UploaderPlus({
            config: config,
            onUpload: (response) => {               
                super.onUpload(response);
            },
            onError: (error) => {
                super.uploadingFailed(error);
            }
        });
    }
}