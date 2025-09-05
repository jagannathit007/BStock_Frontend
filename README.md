# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



   /* List View */
          //   <div className="flex-1 flex flex-col">
          //     <div className="overflow-y-auto flex-1">
          //       <div className="space-y-4 pb-4">
          //         {biddingProducts.map((product) => (
          //           <div
          //             key={product.id}
          //             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          //           >
          //             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          //               {/* Product Image */}
          //               <div className="relative flex-shrink-0">
          //                 <img
          //                   className="w-24 h-24 object-cover rounded-lg"
          //                   src={product.imageUrl}
          //                   alt={product.name}
          //                 />
          //                 <div className="absolute -top-1 -right-1">
          //                   <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          //                     Live
          //                   </span>
          //                 </div>
          //               </div>

          //               {/* Product Details */}
          //               <div className="flex-1 min-w-0">
          //                 <h3 className="text-xl font-bold text-gray-900 mb-1">
          //                   {product.name}
          //                 </h3>
          //                 <p className="text-sm text-gray-600 mb-3">
          //                   {product.description}
          //                 </p>
          //                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          //                   <span>
          //                     Current Bid:{" "}
          //                     <span className="font-semibold text-blue-700">
          //                       {product.currentBid}
          //                     </span>
          //                   </span>
          //                   <span>Starting: {product.startingPrice}</span>
          //                   <span>{product.bids} bids</span>
          //                 </div>
          //               </div>

          //               {/* Timer */}
          //               <div className="text-center flex-shrink-0 sm:ml-auto">
          //                 <div className="text-sm text-gray-600 mb-1">
          //                   Time Left
          //                 </div>
          //                 <div className="text-lg font-bold text-red-600">
          //                   {product.timer}
          //                 </div>
          //               </div>

          //               {/* Actions */}
          //               <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-normal">
          //                 <button
          //                   className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center ${
          //                     product.isLeading
          //                       ? "bg-green-600 text-white"
          //                       : "bg-blue-700 text-white hover:bg-blue-800"
          //                   }`}
          //                 >
          //                   <FontAwesomeIcon
          //                     icon={product.isLeading ? faCrown : faGavel}
          //                     className="mr-2"
          //                   />
          //                   {product.isLeading ? "Leading Bid" : "Place Bid"}
          //                 </button>
          //                 <button className="border border-gray-300 rounded-lg hover:bg-gray-50 h-10 w-10 flex items-center justify-center">
          //                   <FontAwesomeIcon
          //                     icon={faEye}
          //                     className="text-gray-600"
          //                   />
          //                 </button>
          //               </div>
          //             </div>
          //           </div>
          //         ))}
          //       </div>
          //     </div>
          //   </div>

          ===========================================================



