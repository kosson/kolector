// document.addEventListener("DOMContentLoaded", function clbkDOMContentLoaded () {
//     if (bootstrap) {
//         var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
//         var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
//           // tooltipTriggerEl.addEventListener('show.bs.tooltip', function () {
//           //   alert('Am fost activat');
//           // })
//           // tooltipTriggerEl.addEventListener('shown.bs.tooltip', function () {
//           //   alert('Am fost afișat');
//           // })
//           // tooltipTriggerEl.addEventListener('hide.bs.tooltip', function () {
//           //   alert('Sunt pe cale sa fiu pitit');
//           // })
//           // tooltipTriggerEl.addEventListener('hidden.bs.tooltip', function () {
//           //   alert('Am fost ascuns');
//           // })
//           // tooltipTriggerEl.addEventListener('inserted.bs.tooltip', function () {
//           //   alert('Am fost introdus în DOM');
//           // })
//           let t = new bootstrap.Tooltip(tooltipTriggerEl, {
//             container: 'body', 
//             animation: true, 
//             html: true, 
//             placement: "left", 
//             trigger: 'hover focus',
//             delay: { "show": 500, "hide": 100 }
//           });
//           tooltipTriggerEl.addEventListener('mouseover', function () {
//             t.show();
//           });
//           tooltipTriggerEl.addEventListener('mouseleave', function () {
//             t.hide();
//           })
//           return t;   
//         });
//     }
// });