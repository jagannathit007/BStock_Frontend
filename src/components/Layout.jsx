import React from "react";

const Layout = ({ children, className = "", ...props }) => {
  return (
    <main className={`max-w-full py-[90px] px-[80px] mx-auto  ${className}`} {...props}>
      {children}
    </main>
  );
};

export default Layout;
