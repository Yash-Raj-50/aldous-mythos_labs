type GridProps = {
  children: React.ReactNode;
};

const Grid: React.FC<GridProps> = ({ children }) => {
  return (
    <div className="h-full w-full grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 px-8 grid-flow-dense">
      {children}
    </div>
  );
};

export default Grid;
