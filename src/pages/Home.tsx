import {
  IonPage,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>File Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2>Bienvenido</h2>
        <p>Gestor de archivos profesional en construcción 🚀</p>
      </IonContent>
    </IonPage>
  );
};

export default Home;
