export interface FormHeaderProps {
  title: string;
  description?: string;
  descriptionComponent?: React.ReactNode;
}
export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  description,
  descriptionComponent,
}) => {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      {descriptionComponent ? (
        descriptionComponent
      ) : (
        <p className="text-gray-600">{description}</p>
      )}
    </div>
  );
};
