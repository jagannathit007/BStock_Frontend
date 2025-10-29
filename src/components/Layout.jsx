import React from "react";

const Layout = ({ children, className = "", ...props }) => {
  return (
    <main className={`max-w-full py-10 px-2 sm:px-4 md:px-6 xl:py-[20px] xl:px-[80px] mx-auto  ${className}`} {...props}>
      {children}
    </main>
  );
};

export default Layout;
