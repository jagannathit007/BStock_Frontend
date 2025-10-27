import React from "react";

const Layout = ({ children, className = "", ...props }) => {
  return (
    <main className={`max-w-full py-10 px-10 md:py-[20px] md:px-[80px] mx-auto  ${className}`} {...props}>
      {children}
    </main>
  );
};

export default Layout;
