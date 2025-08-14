// يجعل صفحات الأدمن بعرض ثابت 1280px ويترك Pinch-Zoom مفعّل
export default function Head() {
  return (
    <>
      <meta
        name="viewport"
        content="width=1280, initial-scale=1, user-scalable=yes, maximum-scale=5"
      />
    </>
  );
}
